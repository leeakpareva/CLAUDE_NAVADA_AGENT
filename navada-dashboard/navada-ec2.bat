@echo off
REM NAVADA EC2 — One-command SSM access from ASUS
REM No SSH key, no password. Uses IAM credentials via AWS CLI.
REM Usage: navada-ec2         (starts interactive shell)
REM        navada-ec2 status  (quick status check)
REM        navada-ec2 start   (start EC2 if stopped)
REM        navada-ec2 claude  (start Claude CLI on EC2)

SET INSTANCE=i-0055e7ace24db38b0
SET REGION=eu-west-2

IF "%1"=="" GOTO shell
IF "%1"=="status" GOTO status
IF "%1"=="start" GOTO startec2
IF "%1"=="claude" GOTO claude
IF "%1"=="dashboard" GOTO dashboard
IF "%1"=="stop" GOTO stop
GOTO shell

:status
echo Checking EC2 status...
aws ec2 describe-instances --instance-ids %INSTANCE% --region %REGION% --query "Reservations[0].Instances[0].{State:State.Name,IP:PublicIpAddress,Type:InstanceType}" --output table
aws ssm describe-instance-information --filters "Key=InstanceIds,Values=%INSTANCE%" --region %REGION% --query "InstanceInformationList[0].{SSM:PingStatus,Agent:AgentVersion,Platform:PlatformName}" --output table
GOTO end

:startec2
echo Starting EC2...
aws ec2 start-instances --instance-ids %INSTANCE% --region %REGION% --query "StartingInstances[0].CurrentState.Name" --output text
echo Waiting for instance to be running...
aws ec2 wait instance-running --instance-ids %INSTANCE% --region %REGION%
echo EC2 is running. Waiting for SSM agent...
timeout /t 15 /nobreak >nul
GOTO shell

:shell
echo Connecting to NAVADA EC2 via SSM...
aws ssm start-session --target %INSTANCE% --region %REGION%
GOTO end

:claude
echo Launching Claude CLI on EC2 via SSM...
aws ssm start-session --target %INSTANCE% --region %REGION% --document-name AWS-StartInteractiveCommand --parameters command="claude"
GOTO end

:dashboard
echo Opening dashboard...
start http://100.98.118.33:9090/
GOTO end

:stop
echo Stopping EC2...
aws ec2 stop-instances --instance-ids %INSTANCE% --region %REGION% --query "StoppingInstances[0].CurrentState.Name" --output text
GOTO end

:end
