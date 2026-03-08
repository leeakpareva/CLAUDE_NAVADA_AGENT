$cpu = (Get-CimInstance Win32_Processor).LoadPercentage
$os = Get-CimInstance Win32_OperatingSystem
$mem = [math]::Round(($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / $os.TotalVisibleMemorySize * 100, 1)
$disk = Get-CimInstance Win32_LogicalDisk -Filter "DeviceID='C:'"
$dPct = [math]::Round(($disk.Size - $disk.FreeSpace) / $disk.Size * 100, 1)
$dFree = [math]::Round($disk.FreeSpace / 1GB, 1)
Write-Output "$cpu|$mem|$dPct|$dFree"
