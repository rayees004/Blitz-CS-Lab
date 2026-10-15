"""
Blitz Cyber Lab - Secure Production Deployment Utility
This script deploys the latest git commit to cPanel without exposing confidential information.
Credentials are read strictly from environment variables or a local untracked `.env.deploy` file.
"""
import os
import sys
import getpass

try:
    import paramiko
except ImportError:
    print("Paramiko is required. Install via: pip install paramiko")
    sys.exit(1)


def load_env_file(filepath=".env.deploy"):
    """Safely loads key-value pairs from an untracked env file if present."""
    if not os.path.exists(filepath):
        return
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if not line or line.startswith("#") or "=" not in line:
                    continue
                k, v = line.split("=", 1)
                k = k.strip()
                v = v.strip().strip("'").strip('"')
                if k not in os.environ:
                    os.environ[k] = v
    except Exception as e:
        print(f"Warning: could not read {filepath}: {e}")


def main():
    load_env_file()

    hostname = os.getenv("CPANEL_SSH_HOST", "decodexe.com")
    port = int(os.getenv("CPANEL_SSH_PORT", "22"))
    username = os.getenv("CPANEL_SSH_USER")
    password = os.getenv("CPANEL_SSH_PASSWORD")
    key_path = os.getenv("CPANEL_SSH_KEY_PATH")

    print("=" * 60)
    print("Blitz Cyber Lab - Production Deployment")
    print(f"Target Server: {hostname}:{port}")
    print("=" * 60)

    if not username:
        username = input("Enter SSH Username (e.g. decodexe): ").strip()
        if not username:
            print("Error: Username is required.")
            return

    if not password and not key_path:
        password = getpass.getpass(f"Enter SSH Password for {username}@{hostname}: ")

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    connect_kwargs = {
        "hostname": hostname,
        "port": port,
        "username": username,
        "timeout": 25,
    }
    if key_path and os.path.exists(key_path):
        connect_kwargs["key_filename"] = key_path
    if password:
        connect_kwargs["password"] = password

    try:
        print("\nConnecting to server via SSH...")
        ssh.connect(**connect_kwargs)
        print("Connected successfully!\n")
    except Exception as e:
        print(f"Connection failed: {e}")
        print("\nAlternative (cPanel Terminal):")
        print("1. Log in to cPanel at: https://decodexe.com:2083")
        print("2. Open 'Terminal' and run:")
        print("   cd /home/decodexe/decodexe/Blitz-CS-Lab")
        print("   git pull origin main")
        print("   /home/decodexe/deploy.sh")
        print("=" * 60)
        return

    commands = [
        (
            "Pulling latest git version from origin/main...",
            "cd /home/decodexe/decodexe/Blitz-CS-Lab && git fetch origin && git reset --hard origin/main"
        ),
        (
            "Applying Django migrations...",
            "cd /home/decodexe/decodexe/Blitz-CS-Lab/backend && python manage.py migrate --noinput"
        ),
        (
            "Running server deploy routine...",
            "if [ -f /home/decodexe/deploy.sh ]; then /bin/bash /home/decodexe/deploy.sh; else touch /home/decodexe/decodexe/Blitz-CS-Lab/tmp/restart.txt; fi"
        ),
    ]

    for title, cmd in commands:
        print(f"\n[STEP] {title}")
        print(f"Command: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        if out.strip():
            print("Output:\n", out.strip())
        if err.strip():
            print("Notice/Stderr:\n", err.strip())

    ssh.close()
    print("\n" + "=" * 60)
    print("Deployment completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
