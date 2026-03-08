@echo off
echo Configuring AWS CLI...
echo.
echo Please provide your AWS credentials:
echo You can find these in your AWS Console under:
echo IAM -> Users -> Your User -> Security credentials -> Access keys
echo.
set /p AWS_ACCESS_KEY_ID="Enter AWS Access Key ID: "
set /p AWS_SECRET_ACCESS_KEY="Enter AWS Secret Access Key: "
set /p AWS_DEFAULT_REGION="Enter Default Region (e.g., eu-west-2): "

"C:\Program Files\Amazon\AWSCLIV2\aws.exe" configure set aws_access_key_id %AWS_ACCESS_KEY_ID%
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" configure set aws_secret_access_key %AWS_SECRET_ACCESS_KEY%
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" configure set region %AWS_DEFAULT_REGION%
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" configure set output json

echo.
echo AWS CLI configured! Testing connection...
"C:\Program Files\Amazon\AWSCLIV2\aws.exe" sts get-caller-identity
echo.
pause