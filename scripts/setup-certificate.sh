#!/bin/bash

# Setup SSL Certificate for Custom Domain
# Usage: ./scripts/setup-certificate.sh [options]
# Options:
#   -d, --domain         Domain name (required)
#   -z, --zone           Route 53 Hosted Zone ID (required)
#   -h, --help           Show this help message
#
# Examples:
#   ./scripts/setup-certificate.sh -d "dev-carbonlens-ai.solutionsynth.cloud" -z "Z02373041SS8TKQHXZLAR"

set -e  # Exit on error

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
write_step() {
    echo -e "${BLUE}🔐 $1${NC}"
}

write_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

write_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

write_error() {
    echo -e "${RED}❌ $1${NC}"
}

show_help() {
    echo "Setup SSL Certificate for Custom Domain"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -d, --domain         Domain name (required)"
    echo "  -z, --zone           Route 53 Hosted Zone ID (required)"
    echo "  -h, --help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -d \"dev-carbonlens-ai.solutionsynth.cloud\" -z \"Z02373041SS8TKQHXZLAR\""
}

# Default values
DOMAIN_NAME=""
HOSTED_ZONE_ID=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -d|--domain)
            DOMAIN_NAME="$2"
            shift 2
            ;;
        -z|--zone)
            HOSTED_ZONE_ID="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            write_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Validate required parameters
if [ -z "$DOMAIN_NAME" ]; then
    write_error "Domain name is required. Use -d or --domain"
    show_help
    exit 1
fi

if [ -z "$HOSTED_ZONE_ID" ]; then
    write_error "Hosted Zone ID is required. Use -z or --zone"
    show_help
    exit 1
fi

write_step "Setting up SSL certificate for domain: $DOMAIN_NAME"

# Check if certificate already exists
write_step "Checking for existing certificate..."
EXISTING_CERT=$(aws acm list-certificates \
    --region us-east-1 \
    --query "CertificateSummaryList[?DomainName=='$DOMAIN_NAME'].CertificateArn" \
    --output text 2>/dev/null || echo "")

if [ -n "$EXISTING_CERT" ] && [ "$EXISTING_CERT" != "None" ]; then
    write_success "Certificate already exists: $EXISTING_CERT"
    echo "CERTIFICATE_ARN=$EXISTING_CERT"
    exit 0
fi

# Check if hosted zone exists
write_step "Verifying hosted zone..."
ZONE_EXISTS=$(aws route53 get-hosted-zone --id "$HOSTED_ZONE_ID" --query 'HostedZone.Id' --output text 2>/dev/null || echo "")

if [ -z "$ZONE_EXISTS" ]; then
    write_error "Hosted zone $HOSTED_ZONE_ID not found"
    exit 1
fi

write_success "Hosted zone verified: $HOSTED_ZONE_ID"

# Request certificate
write_step "Requesting SSL certificate..."
CERT_ARN=$(aws acm request-certificate \
    --domain-name "$DOMAIN_NAME" \
    --validation-method DNS \
    --region us-east-1 \
    --query 'CertificateArn' \
    --output text)

if [ -z "$CERT_ARN" ]; then
    write_error "Failed to request certificate"
    exit 1
fi

write_success "Certificate requested: $CERT_ARN"

# Wait for certificate validation records
write_step "Waiting for DNS validation records..."
sleep 10

# Get validation records
VALIDATION_RECORDS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region us-east-1 \
    --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
    --output json)

if [ "$VALIDATION_RECORDS" = "null" ] || [ -z "$VALIDATION_RECORDS" ]; then
    write_warning "Validation records not ready yet, waiting..."
    sleep 30
    
    VALIDATION_RECORDS=$(aws acm describe-certificate \
        --certificate-arn "$CERT_ARN" \
        --region us-east-1 \
        --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
        --output json)
fi

if [ "$VALIDATION_RECORDS" = "null" ] || [ -z "$VALIDATION_RECORDS" ]; then
    write_error "Could not get validation records"
    exit 1
fi

# Extract validation record details
RECORD_NAME=$(echo "$VALIDATION_RECORDS" | jq -r '.Name')
RECORD_VALUE=$(echo "$VALIDATION_RECORDS" | jq -r '.Value')
RECORD_TYPE=$(echo "$VALIDATION_RECORDS" | jq -r '.Type')

write_step "Creating DNS validation record..."
echo "  Name: $RECORD_NAME"
echo "  Type: $RECORD_TYPE"
echo "  Value: $RECORD_VALUE"

# Create Route 53 change batch
CHANGE_BATCH=$(cat <<EOF
{
    "Changes": [
        {
            "Action": "CREATE",
            "ResourceRecordSet": {
                "Name": "$RECORD_NAME",
                "Type": "$RECORD_TYPE",
                "TTL": 300,
                "ResourceRecords": [
                    {
                        "Value": "$RECORD_VALUE"
                    }
                ]
            }
        }
    ]
}
EOF
)

# Apply DNS changes
CHANGE_ID=$(aws route53 change-resource-record-sets \
    --hosted-zone-id "$HOSTED_ZONE_ID" \
    --change-batch "$CHANGE_BATCH" \
    --query 'ChangeInfo.Id' \
    --output text)

if [ -z "$CHANGE_ID" ]; then
    write_error "Failed to create DNS validation record"
    exit 1
fi

write_success "DNS validation record created: $CHANGE_ID"

# Wait for DNS propagation
write_step "Waiting for DNS propagation..."
aws route53 wait resource-record-sets-changed --id "$CHANGE_ID"
write_success "DNS changes propagated"

# Wait for certificate validation
write_step "Waiting for certificate validation (this may take 5-10 minutes)..."
aws acm wait certificate-validated --certificate-arn "$CERT_ARN" --region us-east-1

# Verify certificate status
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region us-east-1 \
    --query 'Certificate.Status' \
    --output text)

if [ "$CERT_STATUS" = "ISSUED" ]; then
    write_success "🎉 Certificate successfully validated and issued!"
    write_success "Certificate ARN: $CERT_ARN"
    echo "CERTIFICATE_ARN=$CERT_ARN"
else
    write_error "Certificate validation failed. Status: $CERT_STATUS"
    exit 1
fi

write_step "Certificate Setup Summary:"
echo "  Domain: $DOMAIN_NAME"
echo "  Certificate ARN: $CERT_ARN"
echo "  Status: ISSUED"
echo "  Hosted Zone: $HOSTED_ZONE_ID"

write_success "✅ SSL certificate setup completed successfully!"