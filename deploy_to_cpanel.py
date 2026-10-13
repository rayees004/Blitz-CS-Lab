"""
Blitz Cyber Lab - Deployment Utility
This script automates deploying the latest code to cPanel without removing any existing PostgreSQL data.
"""
import paramiko
import sys

HOSTNAME = 'decodexe.com'
PORT = 22
USERNAME = 'decodexe'
PASSWORD = '9senm1bqaTt@3S'

def main():
    print("=" * 60)
    print("Connecting to cPanel Server:", HOSTNAME)
    print("=" * 60)
    
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(HOSTNAME, port=PORT, username=USERNAME, password=PASSWORD, timeout=20)
        print("Connected via SSH successfully!\n")
    except Exception as e:
        print(f"Could not connect via SSH directly ({e}).")
        print("\nIf SSH is blocked from external networks or disabled in cPanel:")
        print("1. Log in to cPanel at: https://decodexe.com:2083")
        print("2. Open the 'Terminal' app.")
        print("3. Run the following safe commands:\n")
        print("   cd /home/decodexe/decodexe/Blitz-CS-Lab")
        print("   git pull origin main")
        print("   source /home/decodexe/virtualenv/.../bin/activate  # activate your Python venv")
        print("   python manage.py migrate")
        print("   touch /home/decodexe/repositories/Blitz-CS-Lab/tmp/restart.txt  # restart Passenger app")
        print("=" * 60)
        return

    commands = [
        ("Pulling latest code from GitHub...", "cd /home/decodexe/decodexe/Blitz-CS-Lab && git fetch origin && git reset --hard origin/main"),
        ("Running non-destructive PostgreSQL migrations...", "cd /home/decodexe/decodexe/Blitz-CS-Lab/backend && python manage.py migrate"),
        ("Running deploy script...", "/home/decodexe/deploy.sh"),
    ]

    for title, cmd in commands:
        print(f"\n[STEP] {title}")
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = ssh.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        if out:
            print("STDOUT:\n", out)
        if err:
            print("STDERR:\n", err)

    ssh.close()
    print("\nDeployment script completed.")

if __name__ == '__main__':
    main()
