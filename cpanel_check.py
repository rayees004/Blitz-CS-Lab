import paramiko
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('decodexe.com', port=22, username='decodexe', password='9senm1bqaTt@3S')
stdin, stdout, stderr = ssh.exec_command('tail -n 20 /home/decodexe/deploy_log.txt; echo "---"; cat /home/decodexe/deploy.sh')
print('STDOUT:', stdout.read().decode('utf-8'))
print('STDERR:', stderr.read().decode('utf-8'))
ssh.close()
