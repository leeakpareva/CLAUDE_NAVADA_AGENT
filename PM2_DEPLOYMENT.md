# PM2 Multi-Server Deployment for NAVADA Network

## Dashboard Access
- **URL**: https://app.pm2.io/#/r/7ogf0c2lvka1ere
- **Bucket ID**: 69aa4442b84819c2f2ccac2e

## Server Deployment Instructions

### 1. NAVADA HP Server (Windows - 100.121.187.67)
```powershell
# SSH into the server via Tailscale
ssh lee@100.121.187.67

# Download and run the PowerShell setup script
Invoke-WebRequest -Uri "https://raw.githubusercontent.com/yourusername/navada/main/setup-pm2-servers.ps1" -OutFile setup-pm2.ps1
.\setup-pm2.ps1
```

### 2. Oracle Cloud VM (Linux - 100.77.206.9)
```bash
# SSH into the server
ssh ubuntu@100.77.206.9

# Download and run the setup script
wget https://raw.githubusercontent.com/yourusername/navada/main/setup-pm2-servers.sh
chmod +x setup-pm2-servers.sh
./setup-pm2-servers.sh
```

### 3. AWS EC2 (Linux - 100.98.118.33)
```bash
# SSH into the server
ssh ec2-user@100.98.118.33

# Download and run the setup script
wget https://raw.githubusercontent.com/yourusername/navada/main/setup-pm2-servers.sh
chmod +x setup-pm2-servers.sh
./setup-pm2-servers.sh
```

## Manual Deployment (Copy & Paste Method)

### For Linux Servers (Oracle & AWS):
1. SSH into the server
2. Create the setup script:
```bash
nano setup-pm2.sh
```
3. Copy the contents of `setup-pm2-servers.sh`
4. Make it executable and run:
```bash
chmod +x setup-pm2.sh
./setup-pm2.sh
```

### For Windows Server (NAVADA HP):
1. RDP or SSH into the server
2. Open PowerShell as Administrator
3. Copy and paste the contents of `setup-pm2-servers.ps1`
4. Run the script

## Quick One-Liner Deployment

### Linux (Oracle & AWS):
```bash
curl -s https://raw.githubusercontent.com/yourusername/navada/main/setup-pm2-servers.sh | bash
```

### Windows (PowerShell):
```powershell
iex ((New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/yourusername/navada/main/setup-pm2-servers.ps1'))
```

## Verify Installation
After deployment on each server, verify:
1. Check PM2 processes: `pm2 list`
2. Check PM2 link status: `pm2 info`
3. Visit dashboard: https://app.pm2.io/#/r/7ogf0c2lvka1ere

## Existing Processes to Monitor
If you have existing Node.js applications on these servers, add them to PM2:
```bash
# Example for existing app
pm2 start app.js --name "my-app"
pm2 save
```

## Troubleshooting
- If server doesn't appear in dashboard: `pm2 link 7x8u4nnk1tpr9hu 7ogf0c2lvka1ere SERVERNAME`
- If metrics aren't showing: Ensure `@pm2/io` is installed in your app's node_modules
- For Windows firewall issues: Allow Node.js through Windows Firewall

## Server Status Check URLs
Once deployed, each server will have a monitor endpoint:
- NAVADA HP: http://100.121.187.67:8080
- Oracle VM: http://100.77.206.9:8080
- AWS EC2: http://100.98.118.33:8080