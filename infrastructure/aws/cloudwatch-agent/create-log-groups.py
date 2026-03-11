#!/usr/bin/env python3
"""
NAVADA Edge — CloudWatch Log Groups + IAM Setup
Creates all log groups, IAM roles, instance profiles, and SSM hybrid activations.
Run from ASUS (dev workstation) with admin AWS credentials.

Usage: py create-log-groups.py
"""

import json
import time
import boto3
from botocore.exceptions import ClientError

REGION = 'eu-west-2'
ACCOUNT_ID = '491085390194'

# All log groups to create
LOG_GROUPS = [
    # EC2 (NAVADA-COMPUTE)
    '/navada/ec2/system',
    '/navada/ec2/auth',
    '/navada/ec2/cloud-init',
    '/navada/ec2/pm2',
    '/navada/ec2/agent',
    '/navada/ec2/app',
    # Oracle (NAVADA-ROUTER)
    '/navada/oracle/system',
    '/navada/oracle/auth',
    '/navada/oracle/docker',
    # HP (NAVADA-EDGE-SERVER)
    '/navada/hp/system',
    '/navada/hp/auth',
    '/navada/hp/app',
    # ASUS (NAVADA-CONTROL)
    '/navada/asus/system',
    '/navada/asus/app',
    # Cloudflare Worker (via custom log shipping)
    '/navada/cloudflare/worker',
    '/navada/cloudflare/telegram',
    '/navada/cloudflare/vision',
]

RETENTION_DAYS = 30
EC2_INSTANCE_ID = 'i-0055e7ace24db38b0'


def main():
    logs_client = boto3.client('logs', region_name=REGION)
    iam_client = boto3.client('iam', region_name=REGION)
    ssm_client = boto3.client('ssm', region_name=REGION)
    ec2_client = boto3.client('ec2', region_name=REGION)

    print('=' * 60)
    print('NAVADA Edge — CloudWatch Infrastructure Setup')
    print(f'Region: {REGION} | Account: {ACCOUNT_ID}')
    print('=' * 60)

    # === Step 1: Create Log Groups ===
    print('\n[1/5] Creating CloudWatch Log Groups...')
    for group in LOG_GROUPS:
        try:
            logs_client.create_log_group(logGroupName=group)
            print(f'  CREATED: {group}')
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceAlreadyExistsException':
                print(f'  EXISTS:  {group}')
            else:
                print(f'  ERROR:   {group} — {e}')

        # Set retention
        try:
            logs_client.put_retention_policy(
                logGroupName=group,
                retentionInDays=RETENTION_DAYS
            )
        except ClientError:
            pass

    # === Step 2: Create IAM Role for EC2 CloudWatch Agent ===
    print('\n[2/5] Creating IAM Role for EC2...')
    ec2_role_name = 'NAVADA-EC2-CloudWatch-Role'
    ec2_profile_name = 'NAVADA-EC2-CloudWatch-Profile'

    trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    try:
        iam_client.create_role(
            RoleName=ec2_role_name,
            AssumeRolePolicyDocument=json.dumps(trust_policy),
            Description='NAVADA EC2 CloudWatch Agent + SSM role',
            Tags=[{'Key': 'Project', 'Value': 'NAVADA'}, {'Key': 'ManagedBy', 'Value': 'Claude'}]
        )
        print(f'  CREATED: Role {ec2_role_name}')
    except ClientError as e:
        if 'EntityAlreadyExists' in str(e):
            print(f'  EXISTS:  Role {ec2_role_name}')
        else:
            print(f'  ERROR:   {e}')

    # Attach managed policies
    policies = [
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    ]
    for policy_arn in policies:
        try:
            iam_client.attach_role_policy(RoleName=ec2_role_name, PolicyArn=policy_arn)
            print(f'  ATTACHED: {policy_arn.split("/")[-1]}')
        except ClientError as e:
            print(f'  (policy already attached or error: {e})')

    # Create instance profile and attach role
    try:
        iam_client.create_instance_profile(InstanceProfileName=ec2_profile_name)
        print(f'  CREATED: Instance Profile {ec2_profile_name}')
        time.sleep(2)
    except ClientError as e:
        if 'EntityAlreadyExists' in str(e):
            print(f'  EXISTS:  Instance Profile {ec2_profile_name}')
        else:
            print(f'  ERROR:   {e}')

    try:
        iam_client.add_role_to_instance_profile(
            InstanceProfileName=ec2_profile_name,
            RoleName=ec2_role_name
        )
        print(f'  LINKED:  {ec2_role_name} -> {ec2_profile_name}')
    except ClientError as e:
        if 'LimitExceeded' in str(e) or 'Cannot exceed' in str(e):
            print(f'  (role already in profile)')
        else:
            print(f'  (link note: {e})')

    # === Step 3: Attach instance profile to EC2 ===
    print('\n[3/5] Attaching Instance Profile to EC2...')
    try:
        # Check if already associated
        desc = ec2_client.describe_instances(InstanceIds=[EC2_INSTANCE_ID])
        current_profile = desc['Reservations'][0]['Instances'][0].get('IamInstanceProfile')

        if current_profile:
            print(f'  EC2 already has profile: {current_profile["Arn"]}')
            # Check if it's ours
            if ec2_profile_name in current_profile['Arn']:
                print(f'  Correct profile already attached.')
            else:
                print(f'  WARNING: Different profile attached. Manual intervention needed.')
                print(f'  Current: {current_profile["Arn"]}')
                print(f'  Wanted:  {ec2_profile_name}')
        else:
            # Wait for profile to propagate
            print(f'  Waiting for profile propagation...')
            time.sleep(10)
            ec2_client.associate_iam_instance_profile(
                IamInstanceProfile={'Name': ec2_profile_name},
                InstanceId=EC2_INSTANCE_ID
            )
            print(f'  ATTACHED: {ec2_profile_name} -> {EC2_INSTANCE_ID}')
    except ClientError as e:
        print(f'  ERROR: {e}')

    # === Step 4: Create IAM Role for On-Premise (SSM Hybrid) ===
    print('\n[4/5] Creating IAM Role for On-Premise nodes...')
    onprem_role_name = 'NAVADA-OnPrem-CloudWatch-Role'

    ssm_trust_policy = {
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ssm.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }

    try:
        iam_client.create_role(
            RoleName=onprem_role_name,
            AssumeRolePolicyDocument=json.dumps(ssm_trust_policy),
            Description='NAVADA on-premise nodes CloudWatch Agent + SSM role',
            Tags=[{'Key': 'Project', 'Value': 'NAVADA'}, {'Key': 'ManagedBy', 'Value': 'Claude'}]
        )
        print(f'  CREATED: Role {onprem_role_name}')
    except ClientError as e:
        if 'EntityAlreadyExists' in str(e):
            print(f'  EXISTS:  Role {onprem_role_name}')
        else:
            print(f'  ERROR:   {e}')

    # Attach policies for on-prem
    onprem_policies = [
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
    ]
    for policy_arn in onprem_policies:
        try:
            iam_client.attach_role_policy(RoleName=onprem_role_name, PolicyArn=policy_arn)
            print(f'  ATTACHED: {policy_arn.split("/")[-1]}')
        except ClientError as e:
            print(f'  (policy note: {e})')

    # === Step 5: Create SSM Hybrid Activations for on-prem nodes ===
    print('\n[5/5] Creating SSM Hybrid Activations...')
    nodes = [
        {'name': 'NAVADA-ROUTER', 'desc': 'Oracle VM — Docker host'},
        {'name': 'NAVADA-EDGE-SERVER', 'desc': 'HP — SSH-only node server'},
        {'name': 'NAVADA-CONTROL', 'desc': 'ASUS — Dev workstation'},
    ]

    activations = []
    for node in nodes:
        try:
            result = ssm_client.create_activation(
                Description=f'NAVADA Edge: {node["desc"]}',
                IamRole=onprem_role_name,
                RegistrationLimit=1,
                DefaultInstanceName=node['name'],
                Tags=[
                    {'Key': 'Project', 'Value': 'NAVADA'},
                    {'Key': 'Node', 'Value': node['name']},
                ]
            )
            activation = {
                'node': node['name'],
                'activation_id': result['ActivationId'],
                'activation_code': result['ActivationCode'],
            }
            activations.append(activation)
            print(f'  CREATED: {node["name"]}')
            print(f'    ID:   {activation["activation_id"]}')
            print(f'    Code: {activation["activation_code"]}')
        except ClientError as e:
            print(f'  ERROR {node["name"]}: {e}')

    # Save activations to file
    if activations:
        with open('ssm-activations.json', 'w') as f:
            json.dump(activations, f, indent=2)
        print(f'\n  Activations saved to ssm-activations.json')
        print('  USE THESE to register on-prem nodes:')
        for a in activations:
            print(f'    {a["node"]}: ./setup-onprem.sh {a["node"].lower().split("-")[-1]} {a["activation_id"]} {a["activation_code"]}')

    # === Summary ===
    print('\n' + '=' * 60)
    print('SETUP COMPLETE')
    print('=' * 60)
    print(f'\nLog Groups: {len(LOG_GROUPS)} created/verified (30-day retention)')
    print(f'IAM Roles:  {ec2_role_name} (EC2), {onprem_role_name} (On-Prem)')
    print(f'Instance Profile: {ec2_profile_name} -> {EC2_INSTANCE_ID}')
    print(f'SSM Activations: {len(activations)} created')
    print(f'\nNext steps:')
    print(f'  1. SSH to EC2 and run: bash setup-ec2.sh')
    print(f'  2. SSH to Oracle and run: bash setup-onprem.sh oracle <id> <code>')
    print(f'  3. On HP (WSL): bash setup-onprem.sh hp <id> <code>')
    print(f'  4. On ASUS (WSL): bash setup-onprem.sh asus <id> <code>')
    print(f'  5. Check CloudWatch console for metrics + logs')


if __name__ == '__main__':
    main()
