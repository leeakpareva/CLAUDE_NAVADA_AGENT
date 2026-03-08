# Cloud CLI Setup Guide

## AWS CLI Configuration

To configure AWS CLI, you need:
1. **AWS Access Key ID**
2. **AWS Secret Access Key**
3. **Default Region** (e.g., eu-west-2 for London)

Run this command:
```bash
aws configure
```

Or use the batch file:
```bash
./configure-aws.bat
```

To get your AWS credentials:
1. Go to [AWS Console](https://console.aws.amazon.com)
2. Navigate to IAM → Users → Your User
3. Security credentials → Create access key

## Oracle Cloud CLI Configuration

To configure Oracle CLI, you need:
1. **User OCID** (starts with ocid1.user...)
2. **Tenancy OCID** (starts with ocid1.tenancy...)
3. **Region** (e.g., uk-london-1)
4. **API Key** (will be generated)

Run the setup:
```bash
oci setup config
```

This will:
- Create ~/.oci/config
- Generate API signing key pair
- Upload the public key to Oracle Cloud

To get your OCIDs:
1. Go to [Oracle Cloud Console](https://cloud.oracle.com)
2. Profile → User Settings → Copy User OCID
3. Profile → Tenancy → Copy Tenancy OCID

## Test Connections

### AWS
```bash
# Test AWS connection
aws sts get-caller-identity

# List EC2 instances
aws ec2 describe-instances --region eu-west-2

# Check your EC2 (100.98.118.33)
aws ec2 describe-instances --filters "Name=private-ip-address,Values=172.31.38.190"
```

### Oracle Cloud
```bash
# Test Oracle connection
oci iam user get --user-id [your-user-ocid]

# List compute instances
oci compute instance list --compartment-id [your-compartment-id]

# Check your Oracle VM (100.77.206.9)
oci compute instance get --instance-id [your-instance-ocid]
```

## Your NAVADA Nodes

| Node | Tailscale IP | Cloud Provider | CLI Command |
|------|--------------|----------------|-------------|
| HP Server | 100.121.187.67 | Local/Windows | N/A |
| Oracle VM | 100.77.206.9 | Oracle Cloud | `oci` |
| AWS EC2 | 100.98.118.33 | AWS | `aws` |

## Quick Setup Commands

```bash
# AWS - if you have credentials
aws configure set aws_access_key_id YOUR_KEY_ID
aws configure set aws_secret_access_key YOUR_SECRET
aws configure set region eu-west-2

# Oracle - interactive setup
oci setup config
```