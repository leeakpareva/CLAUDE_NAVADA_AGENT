#!/bin/bash
# NAVADA Edge - AWS Resource Inspection (eu-west-2)
REGION="eu-west-2"

echo "=== VPC Information ==="
aws ec2 describe-vpcs --region $REGION --output table

echo -e "\n=== Subnet Information ==="
aws ec2 describe-subnets --region $REGION --query 'Subnets[].{ID:SubnetId,AZ:AvailabilityZone,CIDR:CidrBlock,Public:MapPublicIpOnLaunch}' --output table

echo -e "\n=== Security Groups ==="
aws ec2 describe-security-groups --region $REGION --query 'SecurityGroups[].{ID:GroupId,Name:GroupName,VPC:VpcId}' --output table

echo -e "\n=== Internet Gateways ==="
aws ec2 describe-internet-gateways --region $REGION --output table

echo -e "\n=== Route Tables ==="
aws ec2 describe-route-tables --region $REGION --query 'RouteTables[].{ID:RouteTableId,VPC:VpcId,Routes:Routes[].DestinationCidrBlock}' --output table

echo -e "\n=== EC2 Instances ==="
aws ec2 describe-instances --region $REGION --query 'Reservations[].Instances[].{ID:InstanceId,Type:InstanceType,State:State.Name,IP:PublicIpAddress,AZ:Placement.AvailabilityZone}' --output table

echo -e "\n=== Elastic IPs ==="
aws ec2 describe-addresses --region $REGION --output table

echo -e "\n=== Cost This Month ==="
aws ce get-cost-and-usage \
    --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
    --granularity MONTHLY \
    --metrics BlendedCost UnblendedCost \
    --group-by Type=DIMENSION,Key=SERVICE \
    --output table
