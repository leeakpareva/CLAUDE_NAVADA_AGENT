# Enable Passwordless SSH via Tailscale

Run these commands on each node to enable Tailscale SSH (no passwords or keys needed):

## On HP Windows Server (100.121.187.67)
Open PowerShell as Administrator:
```powershell
tailscale up --ssh
```

## On Oracle VM (100.77.206.9)
```bash
sudo tailscale up --ssh
```

## On AWS EC2 (100.98.118.33)
```bash
sudo tailscale up --ssh
```

## Then from ASUS, connect without passwords:
```bash
# Connect using Tailscale (no password needed)
tailscale ssh leeakpareva@navada
tailscale ssh opc@navada-oracle
tailscale ssh ubuntu@navada-ec2

# Or use regular SSH with Tailscale IPs
ssh root@navada.tail-scale.ts.net
ssh opc@navada-oracle.tail-scale.ts.net
ssh ubuntu@navada-ec2.tail-scale.ts.net
```

## Alternative: Manual Key Setup

If Tailscale SSH doesn't work, manually add this key on each node:

### Oracle VM (as opc user):
```bash
mkdir -p ~/.ssh
echo "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID4t/xGZ2TCArYY0MG3GW694itPGgL46wll7f8TWqtga asus-control@navada-edge" >> ~/.ssh/authorized_keys
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### HP Windows (in PowerShell as Admin):
```powershell
$key = "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAID4t/xGZ2TCArYY0MG3GW694itPGgL46wll7f8TWqtga asus-control@navada-edge"
Add-Content C:\ProgramData\ssh\administrators_authorized_keys $key
icacls C:\ProgramData\ssh\administrators_authorized_keys /inheritance:r /grant "SYSTEM:F" /grant "BUILTIN\Administrators:F"
Restart-Service sshd
```