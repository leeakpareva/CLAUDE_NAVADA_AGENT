#!/bin/bash
# NAVADA Edge - AWS Cost Report

echo "=== Current Month Costs by Service ==="
aws ce get-cost-and-usage \
    --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
    --granularity MONTHLY \
    --metrics BlendedCost \
    --group-by Type=DIMENSION,Key=SERVICE \
    --output table

echo ""
echo "=== Daily Costs This Month ==="
aws ce get-cost-and-usage \
    --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
    --granularity DAILY \
    --metrics BlendedCost \
    --output table

echo ""
echo "=== EC2 Running Instances ==="
aws ec2 describe-instances --region eu-west-2 \
    --filters Name=instance-state-name,Values=running \
    --query 'Reservations[].Instances[].{ID:InstanceId,Type:InstanceType,IP:PublicIpAddress,LaunchTime:LaunchTime}' \
    --output table
