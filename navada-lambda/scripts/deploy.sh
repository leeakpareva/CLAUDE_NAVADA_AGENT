#!/bin/bash
# Deploy NAVADA Lambda functions to AWS
# Usage: bash deploy.sh [function-name]

set -euo pipefail

export PATH="/c/Program Files/Amazon/AWSCLIV2:$PATH"
REGION="eu-west-2"
ROLE_NAME="navada-lambda-role"
ACCOUNT_ID="491085390194"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FUNCTIONS_DIR="$SCRIPT_DIR/../functions"

echo "=== NAVADA Lambda Deploy ==="

# Create IAM role if it doesn't exist
create_role() {
  echo "Creating IAM role..."
  aws iam create-role --role-name $ROLE_NAME \
    --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
      }]
    }' 2>/dev/null || echo "Role already exists"

  aws iam attach-role-policy --role-name $ROLE_NAME \
    --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole 2>/dev/null || true

  echo "Waiting for role propagation..."
  sleep 10
}

# Deploy a single function
deploy_function() {
  local func_name=$1
  local func_dir="$FUNCTIONS_DIR/$func_name"

  if [ ! -d "$func_dir" ]; then
    echo "Function directory not found: $func_dir"
    return 1
  fi

  echo "Deploying: navada-$func_name"

  # Create zip
  local zip_path="/tmp/navada-$func_name.zip"
  cd "$func_dir"
  # Check for node_modules
  if [ -f "package.json" ] && [ ! -d "node_modules" ]; then
    npm install --production 2>/dev/null || true
  fi
  # Zip everything
  powershell -Command "Compress-Archive -Path '$func_dir/*' -DestinationPath '$zip_path' -Force"

  # Check if function exists
  if aws lambda get-function --function-name "navada-$func_name" --region $REGION 2>/dev/null; then
    echo "Updating existing function..."
    aws lambda update-function-code \
      --function-name "navada-$func_name" \
      --zip-file "fileb://$zip_path" \
      --region $REGION
  else
    echo "Creating new function..."
    aws lambda create-function \
      --function-name "navada-$func_name" \
      --runtime nodejs20.x \
      --handler index.handler \
      --role "arn:aws:iam::${ACCOUNT_ID}:role/$ROLE_NAME" \
      --zip-file "fileb://$zip_path" \
      --timeout 30 \
      --memory-size 256 \
      --region $REGION \
      --environment "Variables={HOME_SERVER_IP=100.121.187.67}"
  fi

  echo "Deployed: navada-$func_name"
}

# Create API Gateway (HTTP API)
create_api_gateway() {
  echo "Creating API Gateway..."

  # Check if API exists
  local api_id=$(aws apigatewayv2 get-apis --region $REGION --query "Items[?Name=='navada-api'].ApiId" --output text 2>/dev/null)

  if [ -z "$api_id" ] || [ "$api_id" = "None" ]; then
    api_id=$(aws apigatewayv2 create-api \
      --name navada-api \
      --protocol-type HTTP \
      --region $REGION \
      --query 'ApiId' --output text)
    echo "Created API: $api_id"
  else
    echo "API exists: $api_id"
  fi

  echo "API Gateway URL: https://$api_id.execute-api.$REGION.amazonaws.com"
}

# Main
if [ "${1:-}" = "" ]; then
  echo "Deploying all functions..."
  create_role
  for func_dir in "$FUNCTIONS_DIR"/*/; do
    func_name=$(basename "$func_dir")
    deploy_function "$func_name"
  done
  create_api_gateway
else
  deploy_function "$1"
fi

echo "=== Deploy complete ==="
