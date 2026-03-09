$vbs = "C:\Users\leeak\Alex\Automation\run-hidden.vbs"

$t1 = Get-ScheduledTask -TaskName "NAVADA-DailyCostDigest"
$t1.Actions[0].Execute = "C:\Windows\System32\wscript.exe"
$t1.Actions[0].Arguments = "`"$vbs`" `"node`" C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation\daily-cost-digest.js"
Set-ScheduledTask -InputObject $t1

$t2 = Get-ScheduledTask -TaskName "NAVADA-Infrastructure"
$t2.Actions[0].Execute = "C:\Windows\System32\wscript.exe"
$t2.Actions[0].Arguments = "`"$vbs`" `"powershell.exe`" -ExecutionPolicy Bypass -WindowStyle Hidden -File C:\Users\leeak\CLAUDE_NAVADA_AGENT\infrastructure\startup.ps1"
Set-ScheduledTask -InputObject $t2

$t3 = Get-ScheduledTask -TaskName "NAVADA-MemorySync"
$t3.Actions[0].Execute = "C:\Windows\System32\wscript.exe"
$t3.Actions[0].Arguments = "`"$vbs`" `"cmd.exe`" /c C:\Users\leeak\CLAUDE_NAVADA_AGENT\Automation\memory-sync-push.bat"
Set-ScheduledTask -InputObject $t3

$t4 = Get-ScheduledTask -TaskName "Oracle-Wake"
$t4.Actions[0].Execute = "C:\Windows\System32\wscript.exe"
$t4.Actions[0].Arguments = "`"$vbs`" `"C:\Users\leeak\AppData\Local\Programs\Python\Python312\Scripts\oci.exe`" compute instance action --instance-id ocid1.instance.oc1.uk-london-1.anwgiljswjjqxuqcbg7gznqel6d3p76sd5bvpl2pycoq35kwvi3x35ko33za --action START"
Set-ScheduledTask -InputObject $t4

Write-Output "All 4 tasks updated to use run-hidden.vbs"
