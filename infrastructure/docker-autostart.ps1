New-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "DockerDesktop" -Value '"C:\Program Files\Docker\Docker\Docker Desktop.exe"' -PropertyType String -Force
Write-Host "Docker Desktop added to auto-start"
