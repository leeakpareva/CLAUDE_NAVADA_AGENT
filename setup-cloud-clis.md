# Cloud CLI Setup Guide

## ✅ Installed CLIs

1. **AWS CLI** (v2.34.3) - Installed
2. **Oracle CLI** (v3.73.2) - Installed
3. **Cloudflare Wrangler** - Installed

## Configure AWS CLI

Run this command and enter your credentials:
```bash
aws configure
```

You'll need:
- AWS Access Key ID: (from IAM console)
- AWS Secret Access Key: (from IAM console)
- Default region: eu-west-2 (or your preferred region)
- Default output format: json

Or set directly:
```bash
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set region eu-west-2
```

## Configure Oracle CLI

Run the setup wizard:
```bash
oci setup config
```

You'll need:
- User OCID: (from Oracle Cloud Console > Profile)
- Tenancy OCID: (from Console > Administration > Tenancy Details)
- Region: (e.g., uk-london-1)
- Generate SSH keypair: Yes (or use existing)

## Configure Cloudflare Wrangler

Login to Cloudflare:
```bash
wrangler login
```

Or use API token:
```bash
wrangler config
```

## Test Connections

```bash
# Test AWS
aws ec2 describe-instances --region eu-west-2

# Test Oracle
oci iam region list

# Test Cloudflare
wrangler whoami
```

## Quick Access Commands

```bash
# AWS - List EC2 instances
aws ec2 describe-instances --query 'Reservations[].Instances[].{ID:InstanceId,Type:InstanceType,State:State.Name}'

# Oracle - List compute instances
oci compute instance list --compartment-id <compartment-ocid>

# Cloudflare - List workers
wrangler list
```