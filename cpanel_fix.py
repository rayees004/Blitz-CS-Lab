import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('decodexe.com', port=22, username='decodexe', password='9senm1bqaTt@3S')

commands = [
    "cd /home/decodexe/decodexe/Blitz-CS-Lab && git checkout -- . && git clean -fd",
    "/home/decodexe/deploy.sh"
]

for cmd in commands:
    print(f"Running: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd)
    print('STDOUT:', stdout.read().decode('utf-8'))
    print('STDERR:', stderr.read().decode('utf-8'))

ssh.close()
