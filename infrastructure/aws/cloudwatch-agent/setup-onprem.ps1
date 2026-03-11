# ============================================================
# NAVADA Edge — CloudWatch Agent Setup for Windows On-Premise
# Works on: HP (NAVADA-EDGE-SERVER), ASUS (NAVADA-CONTROL)
#
# Usage: .\setup-onprem.ps1 -NodeName hp -ActivationId xxx -ActivationCode yyy
# ============================================================
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet('hp', 'asus')]
    [string]$NodeName,

    [string]$ActivationId = '',
    [string]$ActivationCode = '',
    [string]$Region = 'eu-west-2'
)

$ErrorActionPreference = 'Stop'
$NodeUpper = $NodeName.ToUpper()

Write-Host "=== NAVADA CloudWatch Agent Setup — Windows ===" -ForegroundColor Cyan
Write-Host "Node: NAVADA-$NodeUpper | Region: $Region"
Write-Host ""

# 1. Download and install CloudWatch Agent
Write-Host "[1/4] Installing CloudWatch Agent..." -ForegroundColor Yellow
$cwAgentPath = "C:\Program Files\Amazon\AmazonCloudWatchAgent"
if (-Not (Test-Path "$cwAgentPath\amazon-cloudwatch-agent-ctl.ps1")) {
    $installer = "$env:TEMP\amazon-cloudwatch-agent.msi"
    Write-Host "  Downloading..."
    Invoke-WebRequest -Uri "https://amazoncloudwatch-agent-$Region.s3.$Region.amazonaws.com/windows/amd64/latest/amazon-cloudwatch-agent.msi" -OutFile $installer
    Write-Host "  Installing..."
    Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /quiet" -Wait
    Remove-Item $installer -ErrorAction SilentlyContinue
    Write-Host "  Installed."
} else {
    Write-Host "  Already installed."
}

# 2. Install SSM Agent (if needed)
Write-Host "[2/4] Checking SSM Agent..." -ForegroundColor Yellow
$ssmService = Get-Service -Name AmazonSSMAgent -ErrorAction SilentlyContinue
if (-Not $ssmService) {
    $ssmInstaller = "$env:TEMP\AmazonSSMAgentSetup.exe"
    Write-Host "  Downloading SSM Agent..."
    Invoke-WebRequest -Uri "https://s3.$Region.amazonaws.com/amazon-ssm-$Region/latest/windows_amd64/AmazonSSMAgentSetup.exe" -OutFile $ssmInstaller
    Write-Host "  Installing..."
    Start-Process $ssmInstaller -ArgumentList "/S" -Wait
    Remove-Item $ssmInstaller -ErrorAction SilentlyContinue
}

if ($ActivationId -and $ActivationCode) {
    Write-Host "  Registering with SSM..."
    & "C:\Program Files\Amazon\SSM\amazon-ssm-agent.exe" -register -code $ActivationCode -id $ActivationId -region $Region -y
    Restart-Service AmazonSSMAgent
    Write-Host "  Registered."
} else {
    Write-Host "  Skipping SSM registration (no activation provided)."
}

# 3. Write agent config
Write-Host "[3/4] Writing agent config..." -ForegroundColor Yellow

# Node-specific log paths
$logPaths = switch ($NodeName) {
    'hp' {
        @(
            @{
                file_path = "C:\Users\leeak\.pm2\logs\*.log"
                log_group_name = "/navada/hp/pm2"
                log_stream_name = "hp-pm2"
                retention_in_days = 30
                timezone = "UTC"
            },
            @{
                file_path = "C:\Users\leeak\Alex\Automation\logs\*.log"
                log_group_name = "/navada/hp/app"
                log_stream_name = "hp-automation"
                retention_in_days = 30
                timezone = "UTC"
            }
        )
    }
    'asus' {
        @(
            @{
                file_path = "C:\Users\leeak\.pm2\logs\*.log"
                log_group_name = "/navada/asus/pm2"
                log_stream_name = "asus-pm2"
                retention_in_days = 30
                timezone = "UTC"
            },
            @{
                file_path = "C:\Users\leeak\Alex\Automation\logs\*.log"
                log_group_name = "/navada/asus/app"
                log_stream_name = "asus-automation"
                retention_in_days = 30
                timezone = "UTC"
            }
        )
    }
}

$config = @{
    agent = @{
        metrics_collection_interval = 60
        logfile = "C:\ProgramData\Amazon\AmazonCloudWatchAgent\Logs\amazon-cloudwatch-agent.log"
    }
    metrics = @{
        namespace = "NAVADA/$NodeUpper-System"
        append_dimensions = @{
            NodeName = "NAVADA-$NodeUpper"
        }
        metrics_collected = @{
            "Processor" = @{
                measurement = @("% Processor Time")
                metrics_collection_interval = 60
                resources = @("_Total")
            }
            "Memory" = @{
                measurement = @("% Committed Bytes In Use", "Available MBytes")
                metrics_collection_interval = 60
            }
            "LogicalDisk" = @{
                measurement = @("% Free Space", "Free Megabytes")
                metrics_collection_interval = 300
                resources = @("C:")
            }
            "Network Interface" = @{
                measurement = @("Bytes Sent/sec", "Bytes Received/sec")
                metrics_collection_interval = 60
                resources = @("*")
            }
        }
    }
    logs = @{
        logs_collected = @{
            files = @{
                collect_list = $logPaths
            }
            windows_events = @{
                collect_list = @(
                    @{
                        event_name = "System"
                        event_levels = @("ERROR", "WARNING", "CRITICAL")
                        log_group_name = "/navada/$NodeName/system"
                        log_stream_name = "$NodeName-windows-system"
                        retention_in_days = 30
                    },
                    @{
                        event_name = "Application"
                        event_levels = @("ERROR", "WARNING")
                        log_group_name = "/navada/$NodeName/app"
                        log_stream_name = "$NodeName-windows-app"
                        retention_in_days = 30
                    }
                )
            }
        }
        log_stream_name = "navada-$NodeName-default"
        force_flush_interval = 30
    }
}

$configPath = "C:\ProgramData\Amazon\AmazonCloudWatchAgent\amazon-cloudwatch-agent.json"
New-Item -ItemType Directory -Path (Split-Path $configPath) -Force | Out-Null
$config | ConvertTo-Json -Depth 10 | Set-Content $configPath -Encoding UTF8
Write-Host "  Config written to $configPath"

# 4. Start agent
Write-Host "[4/4] Starting CloudWatch Agent..." -ForegroundColor Yellow
& "$cwAgentPath\amazon-cloudwatch-agent-ctl.ps1" -a fetch-config -m onPremise -s -c "file:$configPath"
Write-Host "  Agent started."

Write-Host ""
Write-Host "=== NAVADA-$NodeUpper CloudWatch Agent setup complete ===" -ForegroundColor Green
Write-Host "Metrics: NAVADA/$NodeUpper-System namespace"
Write-Host "Logs: /navada/$NodeName/* log groups"
Write-Host "Windows Events: System (ERROR/WARNING/CRITICAL) + Application (ERROR/WARNING)"
