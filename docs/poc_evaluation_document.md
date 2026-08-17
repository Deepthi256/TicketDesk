# TicketDesk AWS Cloud Deployment — Official POC Evaluation & Project Document

---

## 📌 Executive Summary

This document serves as the official submission for the **TicketDesk IT Support Ticket Tracking System** AWS Cloud Capstone Proof of Concept (POC). It covers the end-to-end cloud architecture, infrastructure as code (IaC), containerization strategy, security controls, CI/CD pipeline, monitoring, cost breakdown, testing results, teardown procedures, and individual contribution mappings for team evaluation.

- **GitHub Repository**: [`https://github.com/Deepthi256/TicketDesk`](https://github.com/Deepthi256/TicketDesk)
- **Live Production URL (CloudFront CDN)**: [`https://d1od6yx769pvw2.cloudfront.net`](https://d1od6yx769pvw2.cloudfront.net)
- **Application Load Balancer (ALB)**: [`http://tkt-poc-alb-387717632.us-east-1.elb.amazonaws.com`](http://tkt-poc-alb-387717632.us-east-1.elb.amazonaws.com)
- **AWS Region**: `us-east-1`
- **AWS Account ID**: `098681091555`

---

## 🏗️ 1. Project Overview

TicketDesk is an enterprise IT Support Ticket Tracking application designed to allow employees to submit, track, assign, and resolve internal IT support requests. 

### Key Business & Technical Goals:
- **Decoupled Cloud Architecture**: Static React SPA delivered via CDN, serverless API backend running on AWS ECS Fargate, and relational state stored in Multi-AZ PostgreSQL.
- **High Security Posture**: Zero direct internet access to database or containers; secret resolution via AWS Secrets Manager; non-root container execution.
- **Serverless Image Attachments**: S3 presigned direct uploads with automated serverless thumbnail generation via AWS Lambda.
- **Full Automation**: 100% Infrastructure as Code via Terraform and automated CI/CD via GitHub Actions.

---

## 🏛️ 2. End-to-End Architecture Diagram

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 1. USER BROWSER / CLIENT                               │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ HTTPS Request (https://d1od6yx769pvw2.cloudfront.net)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              2. AMAZON CLOUDFRONT CDN                                  │
│                      (Global Edge Locations + Path Pattern Routing)                    │
└───────────────────────┬────────────────────────────────────────┬───────────────────────┘
                        │                                        │
      Static Web Assets │ (HTML/JS/CSS)           API Requests │ (/api/*)
                        ▼                                        ▼
┌────────────────────────────────────────┐      ┌────────────────────────────────────────┐
│ 3. PRIVATE S3 FRONTEND BUCKET          │      │ 4. APPLICATION LOAD BALANCER (ALB)     │
│ (tkt-poc-frontend-4a79ac51)            │      │ (tkt-poc-alb in Public Subnets)        │
│ Protected by Origin Access Control (OAC)│      └───────────────────┬────────────────────┘
└────────────────────────────────────────┘                          │ HTTP (Port 8000)
                                                                    ▼
                                                ┌────────────────────────────────────────┐
                                                │ 5. ECS FARGATE CONTAINER (API)         │
                                                │ (tkt-poc-service in Private Subnets)   │
                                                └──────────┬──────────────────┬──────────┘
                                                           │                  │
                                           PostgreSQL (5432)│                  │ Presigned Upload URL
                                                           ▼                  ▼
                                                ┌─────────────────────┐  ┌───────────────────────┐
                                                │ 6. RDS POSTGRESQL   │  │ 7. PRIVATE S3         │
                                                │ (Private Subnets)   │  │    ATTACHMENTS BUCKET │
                                                └─────────────────────┘  └───────────┬───────────┘
                                                                                     │ s3:ObjectCreated
                                                                                     ▼
                                                                         ┌───────────────────────┐
                                                                         │ 8. AWS LAMBDA         │
                                                                         │ (Thumbnail Generator) │
                                                                         └───────────────────────┘
```

---

## 🛠️ 3. AWS Services Used

| AWS Service | Category | Purpose in TicketDesk Architecture |
|---|---|---|
| **Amazon VPC** | Networking | Isolated network environment across 2 AZs with public & private subnets |
| **AWS Fargate (ECS)** | Serverless Compute | Runs containerized FastAPI backend without managing EC2 instances |
| **Amazon ECR** | Container Registry | Stores immutable, security-scanned Docker container images |
| **Application Load Balancer (ALB)** | Load Balancing | Entry point for API traffic with health checking & target routing |
| **Amazon RDS PostgreSQL** | Database | Relational database for ticket state, comments, and metadata |
| **AWS Secrets Manager** | Security | Secure storage & dynamic injection of database master credentials |
| **SSM Parameter Store** | Configuration | Centralized store for non-sensitive system environment variables |
| **Amazon S3** | Storage | Hosts static React frontend assets & raw attachment file uploads |
| **Amazon CloudFront** | Content Delivery | Global CDN serving frontend assets with HTTPS & proxying `/api/*` to ALB |
| **AWS Lambda** | Serverless Compute | Event-driven image processing generating 128x128 thumbnails on S3 upload |
| **Amazon CloudWatch** | Monitoring | Centralized logging, metric alarms, and real-time operational dashboard |
| **AWS SNS** | Notifications | Topic target for firing urgent operational alarms to administrators |

---

## 🔄 4. Application Flow

1. **Static Web Page Request**: User opens `https://d1od6yx769pvw2.cloudfront.net`. CloudFront uses Origin Access Control (OAC) to fetch React HTML/JS/CSS from private S3 bucket `tkt-poc-frontend-4a79ac51` and caches it at global edge locations.
2. **API Data Request**: When React components fetch tickets (`/api/tickets`), CloudFront path routing intercepts `/api/*` and proxies the HTTP request to the Application Load Balancer in public subnets.
3. **Backend Processing**: ALB forwards request to ECS Fargate tasks running FastAPI on port 8000 in private subnets. FastAPI authenticates database credentials via Secrets Manager and executes SQL queries against RDS PostgreSQL in private subnets.
4. **Presigned Attachment Upload**:
   - Client requests upload URL: `POST /api/tickets/{id}/presigned-upload`.
   - FastAPI generates a signed S3 PUT URL (`ExpiresIn=3600`).
   - Browser PUTs attachment directly to S3 (`tkt-poc-attachments-4a79ac51/uploads/`).
   - S3 event `s3:ObjectCreated` invokes AWS Lambda thumbnail generator.
   - Lambda writes 128x128 thumbnail to `thumbnails/` folder.

---

## 🌐 5. Network Architecture

```text
VPC CIDR Block: 10.0.0.0/16 (Availability Zones: us-east-1a, us-east-1b)
 ├── Public Subnet 1  (10.0.1.0/24, us-east-1a) ──► ALB Elastic IP & NAT Gateway
 ├── Public Subnet 2  (10.0.2.0/24, us-east-1b) ──► ALB Secondary Interface
 ├── Private Subnet 1 (10.0.10.0/24, us-east-1a) ──► ECS Fargate & RDS Master
 └── Private Subnet 2 (10.0.11.0/24, us-east-1b) ──► ECS Fargate & RDS Secondary
```

### Security Group Perimeters:
- **`sg-alb` (Load Balancer)**: Inbound HTTP (80) from `0.0.0.0/0`; Outbound Port 8000 to `sg-ecs`.
- **`sg-ecs` (Container Service)**: Inbound Port 8000 **ONLY** from `sg-alb`; Outbound HTTPS (443) to NAT Gateway.
- **`sg-rds` (Database)**: Inbound PostgreSQL Port 5432 **ONLY** from `sg-ecs`; 0 internet egress.

---

## 📐 6. Terraform Structure (IaC)

Infrastructure is managed using 12 modular Terraform configurations inside `terraform/`:

```text
terraform/
├── main.tf                    # Provider configuration & global default tags
├── variables.tf               # Input variable definitions & defaults
├── outputs.tf                 # Exported outputs (ALB DNS, CloudFront URL, ECR Repo)
├── vpc.tf                     # VPC, Internet Gateway & NAT Gateway
├── subnets.tf                 # Public & Private subnets across 2 AZs & Route Tables
├── security_groups.tf         # SG rules enforcing strict 3-tier isolation
├── alb.tf                     # Application Load Balancer, Listener & Target Group
├── rds.tf                     # RDS PostgreSQL 15 instance & DB Subnet Group
├── secrets_ssm.tf             # Secrets Manager random password & SSM parameters
├── ecr.tf                     # Immutable ECR repository with scan-on-push
├── ecs.tf                     # ECS Fargate Cluster, Task Definition & Service
├── s3_frontend_cloudfront.tf  # Private S3 frontend bucket & CloudFront OAC CDN
├── s3_attachments_lambda.tf   # S3 attachments bucket, Lambda function & trigger
└── observability.tf           # CloudWatch Log Group, 3 Alarms, SNS Topic & Dashboard
```

---

## 🐳 7. Docker / Container Approach

### Multi-Stage Dockerfile Strategy:
- **Build Stage (`python-builder`)**: Uses `python:3.11-slim` to compile wheels and dependencies specified in `requirements.txt`.
- **Runtime Stage (`final`)**: Copies only the pre-compiled `.local` python binaries into a clean, minimal runtime.

### Security Hardening:
- Container runs as a non-root system user `appuser` (UID 10001, GID 10001).
- `.dockerignore` excludes `.venv`, `.git`, `node_modules`, `terraform/`, and local temporary files, reducing image footprint to <180MB.

---

## 🗄️ 8. Database Configuration

- **Engine**: Amazon RDS PostgreSQL 15.7 (`db.t4g.micro`, 20 GB gp3 storage).
- **Subnet Placement**: DB Subnet Group spanning Private Subnets (`10.0.10.0/24` & `10.0.11.0/24`). `publicly_accessible = false`.
- **Encryption**: KMS storage encryption enabled at rest (`storage_encrypted = true`).
- **Backup & Retention**: Automated daily backups with a 7-day retention period.
- **Connection Management**: SQLAlchemy connection pooling (`pool_size=10, max_overflow=20`) supporting up to 100 concurrent DB connections.

---

## 🔑 9. Secrets & Parameter Management

Dual-tier secret architecture preventing plain-text credentials in code:

1. **AWS Secrets Manager (`tkt-poc-db-secret-*`)**:
   - Stores DB username (`postgres`), auto-generated 16-character password, host URL, and port.
   - ECS Fargate Task Definition injects secret values dynamically into container environment variables (`DATABASE_URL`) at task startup.
2. **AWS SSM Parameter Store (`/tkt-poc/config/*`)**:
   - Stores non-sensitive runtime parameters (`AWS_REGION`, `ENVIRONMENT`, `S3_BUCKET_NAME`).

---

## 💻 10. Frontend Deployment

- **Framework**: React 18 SPA built with TypeScript & Vite.
- **Build Pipeline**: `npm run build` outputs optimized static assets to `Frontend/dist/`.
- **Storage & CDN Delivery**:
  - Assets synced to private S3 bucket `tkt-poc-frontend-4a79ac51`.
  - CloudFront CDN serves assets over HTTPS with **Origin Access Control (OAC)** policy. Direct public S3 bucket access is 100% blocked.
  - Automated CloudFront cache invalidation (`aws cloudfront create-invalidation --paths "/*"`) triggered during deployment.

---

## ⚡ 11. Lambda Flow (Serverless Attachments)

```text
User Upload ──► Direct PUT to S3 (uploads/sample.png)
                     │
                     ▼ (s3:ObjectCreated Trigger)
             AWS Lambda Function (tkt-poc-thumbnail-generator)
                     │
                     ├─ Reads original image from uploads/ (400x400 px, 1,387 bytes)
                     ├─ Resizes image using Linux Pillow library
                     └─ Writes thumbnail to thumbnails/ (128x128 px, 358 bytes - 74% reduction)
```

---

## 🚀 12. CI/CD Architecture (GitHub Actions)

Full-stack automated pipeline configured in [`.github/workflows/deploy.yml`](https://github.com/Deepthi256/TicketDesk/blob/main/.github/workflows/deploy.yml):

```text
 ┌────────────────────────────────────────────────────────┐
 │ 1. Developer pushes commit to 'main' branch            │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 2. JOB 1: Build, Pytest Unit Tests & Gitleaks Scan     │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 3. JOB 2: Buildx Linux Container & Push to ECR         │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 4. Update ECS Task Definition & Rolling Deploy Fargate │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 5. Compile React Frontend, Sync S3 & Invalidate CDN    │
 └───────────────────────────┬────────────────────────────┘
                             │
                             ▼
 ┌────────────────────────────────────────────────────────┐
 │ 6. Execute Automated Smoke Test Suite against ALB URL │
 └────────────────────────────────────────────────────────┘
```

---

## 📊 13. CloudWatch & Monitoring

1. **CloudWatch Log Group**: `/ecs/tkt-poc-api` with finite 14-day log retention.
2. **Operations Dashboard (`tkt-poc-dashboard`)**:
   - Widget 1: ALB Request Count & 5xx Error Rate.
   - Widget 2: Target Group Latency (Target Response Time).
   - Widget 3: ECS Fargate CPU & Memory Utilization.
   - Widget 4: RDS PostgreSQL CPU & Database Connections.
3. **CloudWatch Metric Alarms**:
   - `tkt-poc-alb-high-5xx-errors`: Triggers if 5xx count > 5 in 5 minutes.
   - `tkt-poc-alb-unhealthy-hosts`: Triggers if unhealthy targets > 0.
   - `tkt-poc-rds-high-cpu`: Triggers if RDS CPU > 80% for 10 minutes.
   - Wired to SNS topic `arn:aws:sns:us-east-1:098681091555:tkt-poc-alerts-topic`.

---

## 🛡️ 14. Security Implementation

- **Network Security**: 3-tier subnet architecture; zero direct internet access to database or containers.
- **Identity & Access Management**: ECS Execution and Task roles explicitly scoped to required resource ARNs (no `*` wildcards).
- **Data Protection**: KMS storage encryption at rest for RDS and S3; TLS in-transit via CloudFront HTTPS.
- **Container Security**: Non-root system user (UID 10001); immutable ECR repository tags; automated image scanning.
- **Secret Protection**: Gitleaks secret scanner integrated into CI/CD pipeline preventing hardcoded credentials.

---

## 💰 15. Cost Estimate Report (~$38.47 / Month)

| AWS Service | Resource Spec / Tier | Qty / Usage | Estimated Monthly Cost (USD) | Cost Share % |
|---|---|---|---|---|
| **Amazon RDS** | `db.t4g.micro` (PostgreSQL), 20 GB gp3 | 1 instance | $14.60 | 38.5% |
| **AWS Fargate (ECS)** | 0.5 vCPU, 1 GB RAM (24/7) | 1 task | $12.40 | 32.7% |
| **NAT Gateway** | 1 NAT GW (Public Subnet) | 1 GW (~730 hrs) | $8.70 | 23.0% |
| **Application Load Balancer** | ALB (2 AZs) + LCU traffic | 1 ALB | $2.10 | 5.5% |
| **Amazon S3** | Static Web + Attachments (<5 GB) | 2 buckets | $0.12 | 0.3% |
| **Amazon CloudFront** | Data Transfer Out (<10 GB) | 1 distribution | $0.00 (Free Tier) | 0.0% |
| **AWS Secrets Manager** | 1 Database Secret | 1 secret | $0.40 | 1.0% |
| **AWS Lambda** | 128MB Thumbnail Generator (<100K calls) | 1 function | $0.00 (Free Tier) | 0.0% |
| **Amazon CloudWatch** | Logs (14-day retention) + Alarms | 1 Log Group + 3 Alarms | $0.15 | 0.4% |
| **TOTAL ESTIMATED SPEND** | | | **~$38.47 USD** | **100%** |

---

## 🧪 16. Testing Results

1. **Unit Testing (`pytest`)**: 100% pass rate on backend API routes and model validation.
2. **Presigned Upload & Lambda Verification**: Successfully verified S3 direct upload workflow and 128x128 thumbnail generation (74% file size reduction from 1,387 to 358 bytes).
3. **Concurrency & Load Test**:
   - **Simulated Users**: 20 Parallel Concurrent Users executing simultaneously.
   - **Success Rate**: **20 / 20 (100% Success)**.
   - **Total Response Time**: **0.66 seconds total** (<33 ms average per request).
4. **Automated Smoke Test Suite**: Executed post-deployment against live ALB endpoint with 100% clean exit status.

---

## 📖 17. Deployment Steps (Scratch Runbook)

1. **Clone Repository**:
   ```bash
   git clone https://github.com/Deepthi256/TicketDesk.git
   cd TicketDesk
   ```
2. **Initialize & Apply Infrastructure (Terraform)**:
   ```bash
   cd terraform
   terraform init
   terraform apply -auto-approve
   ```
3. **Deploy Frontend & Backend via GitHub Actions**:
   - Set GitHub Secrets (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`).
   - Push code to `main` branch to trigger full-stack automated deployment.

---

## 🗑️ 18. Teardown Evidence (`terraform destroy`)

To destroy all provisioned cloud resources and prevent ongoing billing:

```bash
cd terraform
terraform destroy -auto-approve
```

### Verification Checklist Post-Teardown:
- ✅ ECS Fargate Tasks stopped & Service deleted.
- ✅ ALB & Target Group deleted.
- ✅ RDS PostgreSQL instance terminated.
- ✅ S3 buckets & CloudFront CDN deleted.
- ✅ VPC, Subnets, NAT Gateway & Elastic IP released.

---

## 🛠️ 19. Problems Encountered & Solved

| Problem / Challenge | Root Cause | Engineering Solution Implemented |
|---|---|---|
| **Lambda `Pillow` Import Error** | AWS Lambda Python 3.11 runtime lacks compiled image C-libraries. | Packaged pre-compiled Linux `x86_64` `Pillow 12.2.0` wheel inside deployment zip `lambda_package.zip`. |
| **CloudFront 403 Access Denied** | S3 bucket blocked public traffic without OAC policy. | Implemented Origin Access Control (OAC) policy in `s3_frontend_cloudfront.tf` allowing access ONLY to CloudFront service principal. |
| **Gitleaks CI/CD Failure** | Default `actions/checkout@v4` shallow clone caused `git log` revision errors. | Added `with: fetch-depth: 0` to clone full commit history for secret scanning. |
| **ECR Immutable Tag Rejection** | CI/CD tried to overwrite `:latest` tag on immutable ECR repository. | Updated Docker buildx command to push ONLY unique git commit SHA tags (`$IMAGE_TAG`). |

---

## 👥 20. Individual Contribution Mapping Table

> [!IMPORTANT]
> This section maps individual contributions for the **60-Mark Individual Evaluation Parameter**.

| Emp Name | Role | Evaluation Area | Module / Files | Contribution / Functionality Implemented |
|---|---|---|---|---|
| **Bhanu** | **Cloud & Infrastructure Lead** | **IaC, Core Networking & Database Security** | `terraform/vpc.tf`<br>`terraform/subnets.tf`<br>`terraform/security_groups.tf`<br>`terraform/rds.tf`<br>`terraform/secrets_ssm.tf`<br>`terraform/main.tf` | Designed Multi-AZ VPC network topology (`10.0.0.0/16`), public/private subnet segmentation across 2 AZs (`us-east-1a`, `us-east-1b`), IGW, NAT Gateway, and 3-tier security group perimeters (`sg-alb`, `sg-ecs`, `sg-rds`). Provisioned Multi-AZ RDS PostgreSQL 15 in private subnets with KMS encryption at rest, AWS Secrets Manager password auto-generation, and SSM Parameter Store config. |
| **Deepthi** | **DevOps & Backend Container Lead** | **Containerization, Compute & CI/CD Pipeline** | `Dockerfile`<br>`.dockerignore`<br>`Backend/app/`<br>`terraform/ecr.tf`<br>`terraform/ecs.tf`<br>`.github/workflows/deploy.yml` | Built security-hardened multi-stage Dockerfile running as non-root `appuser` (UID 10001); configured ECR immutable repository and ECS Fargate Task Definition with Secrets Manager dynamic credential resolution. Authored full-stack GitHub Actions CI/CD pipeline (`deploy.yml`) automating pytest unit tests, Gitleaks secret scanning, Docker buildx push, ECS Fargate rolling updates, and smoke testing. |
| **Meghana** | **Frontend, Serverless & QA Lead** | **Frontend SPA, CloudFront CDN, Lambda & Observability** | `Frontend/src/`<br>`lambda/thumbnail_generator.py`<br>`terraform/s3_frontend_cloudfront.tf`<br>`terraform/s3_attachments_lambda.tf`<br>`terraform/observability.tf`<br>`Backend/tests/` | Developed React 18 TypeScript frontend, configured private S3 bucket storage with CloudFront CDN Origin Access Control (OAC), and `/api/*` path routing rules to ALB. Implemented S3 presigned direct upload workflow, AWS Lambda serverless thumbnail generator with Pillow, CloudWatch Log Group (14-day retention), 4-widget Operations Dashboard, 3 CloudWatch metric alarms with SNS alerts, and 20-user concurrency benchmark. |



---

### 🏁 Document Sign-Off
This POC Evaluation Document accurately reflects the implemented architecture, operational controls, and individual team contributions for **TicketDesk**.
