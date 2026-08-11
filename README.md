# TicketDesk — AWS Cloud Deployment (Capstone POC)

> **Foundation Level Capstone Project**  
> Complete Infrastructure as Code (IaC), Multi-stage Containerization, AWS ECS Fargate, RDS PostgreSQL, CloudFront + S3, Serverless Attachments, CI/CD Pipeline, and CloudWatch Observability.

---

## 🏛️ System Architecture

```text
┌──────────────────┐
│     Browser      │ ───────► CloudFront + S3 (Static React Frontend)
└────────┬─────────┘
         │ /api/*
┌────────▼─────────┐
│ Application Load │ (Public Subnets across 2 AZs)
│     Balancer     │
└────────┬─────────┘
         │
┌────────▼─────────┐
│   ECS Fargate    │ (Private Subnets - Python FastAPI API)
└────┬────────┬────┘
     │        │
┌────▼───┐  ┌─▼──────────────┐
│  RDS   │  │ S3 Attachments │
│Postgres│  │     Bucket     │
└────────┘  └────┬───────────┘
                 │ (s3:ObjectCreated)
            ┌────▼───────────┐
            │  AWS Lambda    │ (Thumbnail Generator)
            └────────────────┘
```

---

## 🚀 Quick Start Guide — Deployment from Scratch

### Prerequisites
- [AWS CLI v2](https://aws.amazon.com/cli/) configured (`aws configure`)
- [Terraform >= 1.5.0](https://www.terraform.io/) installed
- [Docker Desktop](https://www.docker.com/) installed
- Git installed

---

### Step 1: Local Container Verification (Milestone M1)

1. Build local multi-stage Docker image:
   ```bash
   docker build -t ticketdesk-api:local .
   ```
2. Run container locally:
   ```bash
   docker run -d -p 8000:8000 --name ticketdesk ticketdesk-api:local
   ```
3. Test local health check:
   ```bash
   curl http://localhost:8000/health
   ```
   *Expected response*: `{"status":"healthy"}`

---

### Step 2: Infrastructure Provisioning with Terraform (Milestone M2 & M3)

1. Navigate to `terraform/` directory:
   ```bash
   cd terraform
   ```
2. Initialize Terraform modules and providers:
   ```bash
   terraform init
   ```
3. Validate configuration files:
   ```bash
   terraform validate
   ```
4. Review planned resources:
   ```bash
   terraform plan
   ```
5. Apply and provision AWS stack:
   ```bash
   terraform apply -auto-approve
   ```

---

### Step 3: Build & Push Image to ECR

1. Fetch ECR Repository URL from Terraform output:
   ```bash
   export ECR_URL=$(terraform output -raw ecr_repository_url)
   export AWS_REGION="us-east-1"
   ```
2. Authenticate Docker to AWS ECR:
   ```bash
   aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_URL
   ```
3. Tag image with Git commit SHA and push:
   ```bash
   export COMMIT_SHA=$(git rev-parse --short HEAD || echo "v1.0")
   docker tag ticketdesk-api:local $ECR_URL:$COMMIT_SHA
   docker tag ticketdesk-api:local $ECR_URL:latest
   docker push $ECR_URL:$COMMIT_SHA
   docker push $ECR_URL:latest
   ```

---

### Step 4: Build & Deploy Frontend to S3 (Milestone M4)

1. Navigate to `Frontend/`:
   ```bash
   cd ../Frontend
   ```
2. Install dependencies & build production static assets:
   ```bash
   npm install
   npm run build
   ```
3. Upload static assets to private S3 frontend bucket:
   ```bash
   export FRONTEND_BUCKET=$(terraform -chdir=../terraform output -raw s3_frontend_bucket)
   aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete
   ```

---

### Step 5: End-to-End Verification & Smoke Test (Milestone M6 & M8)

1. Obtain CloudFront URL:
   ```bash
   export CLOUDFRONT_URL=$(terraform -chdir=../terraform output -raw cloudfront_url)
   echo "Application Live URL: $CLOUDFRONT_URL"
   ```
2. Run automated smoke tests:
   ```bash
   python ../Backend/tests/smoke_test.py --url $CLOUDFRONT_URL
   ```

---

## 🧹 Stack Destruction & Clean Rebuild (Milestone M8)

To prove 100% Infrastructure as Code reproducibility, tear down all created AWS resources:

```bash
cd terraform
terraform destroy -auto-approve
```

---

## 📊 Verification & Documentation Matrix

- **M0 Manual Runbook**: [docs/m0_manual_deployment_runbook.md](docs/m0_manual_deployment_runbook.md)
- **Deployment Checklist (34 Items)**: [docs/deployment_checklist.md](docs/deployment_checklist.md)
- **Cost Report**: [docs/cost_report.md](docs/cost_report.md)
