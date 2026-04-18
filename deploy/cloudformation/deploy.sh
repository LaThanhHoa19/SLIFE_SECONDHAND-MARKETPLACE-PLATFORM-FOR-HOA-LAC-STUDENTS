#!/bin/bash
# ============================================================
# SLIFE CloudFormation Deploy Script
# Usage: bash deploy.sh
# ============================================================

set -euo pipefail

STACK_NAME="slife-infra"
REGION="ap-southeast-1"
TEMPLATE="slife-infra.yaml"

echo "============================================"
echo "  SLIFE Infrastructure — CloudFormation"
echo "============================================"
echo ""

# ---- Collect parameters ----
read -p "VPC ID (vpc-xxx): " VPC_ID
read -p "Public Subnet 1 (subnet-xxx, AZ1): " PUB_SUB_1
read -p "Public Subnet 2 (subnet-xxx, AZ2): " PUB_SUB_2
read -p "Private Subnet 1 (subnet-xxx, AZ1): " PRIV_SUB_1
read -p "Private Subnet 2 (subnet-xxx, AZ2): " PRIV_SUB_2
read -p "EC2 Instance ID (i-xxx): " EC2_ID
read -p "RDS Endpoint (xxx.rds.amazonaws.com): " RDS_ENDPOINT
read -p "ACM Certificate ARN (arn:aws:acm:... hoặc Enter để bỏ qua): " ACM_ARN

echo ""
echo "Deploying stack: ${STACK_NAME} ..."
echo ""

aws cloudformation deploy \
  --stack-name "${STACK_NAME}" \
  --template-file "${TEMPLATE}" \
  --region "${REGION}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    ExistingVpcId="${VPC_ID}" \
    PublicSubnet1Id="${PUB_SUB_1}" \
    PublicSubnet2Id="${PUB_SUB_2}" \
    PrivateSubnet1Id="${PRIV_SUB_1}" \
    PrivateSubnet2Id="${PRIV_SUB_2}" \
    ExistingEC2InstanceId="${EC2_ID}" \
    ExistingRDSEndpoint="${RDS_ENDPOINT}" \
    ACMCertificateArn="${ACM_ARN}" \
  --tags Project=slife Environment=prod

echo ""
echo "✅ Stack deployed! Fetching outputs..."
echo ""

aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query 'Stacks[0].Outputs' \
  --output table

echo ""
echo "============================================"
echo "  NEXT STEPS:"
echo "  1. Attach EC2 Instance Profile (xem output)"
echo "  2. Attach Security Groups vào EC2 & RDS"
echo "  3. Update .env trên EC2 với Redis & S3 info"
echo "  4. Trỏ CloudFront origin → ALB DNS name"
echo "  5. Restart Docker containers trên EC2"
echo "============================================"
