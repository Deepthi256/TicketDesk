# TicketDesk AWS Cloud Deployment — Master End-to-End Technical Guide

---

## 📌 Executive Overview & System Architecture

This guide provides a comprehensive, step-by-step breakdown of the **TicketDesk IT Support Ticket Tracking System** cloud deployment on Amazon Web Services (AWS). It explains what resources were created, why they were created in a specific order, how each service connects to others, and when files/images are uploaded.

### 🌐 End-to-End AWS System Topology

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
                                                │ (Private Subnet)    │  │    ATTACHMENTS BUCKET │
                                                └─────────────────────┘  └───────────┬───────────┘
                                                                                     │ s3:ObjectCreated
                                                                                     ▼
                                                                         ┌───────────────────────┐
                                                                         │ 8. AWS LAMBDA         │
                                                                         │ (Thumbnail Generator) │
                                                                         └───────────────────────┘
```

---

## 🚀 Step-by-Step Deployment Roadmap (Execution Order)

---

### STEP 1: Containerization & Security Hardening (M1)

Before launching any cloud services, the application must be packaged into an isolated, secure container image.

1. **Multi-Stage Dockerfile**:
   - **Stage 1 (`python-builder`)**: Downloads Python dependencies (`pip install -r requirements.txt`) and packages wheels.
   - **Stage 2 (`final`)**: Copies installed wheels into a lightweight `python:3.11-slim` runtime.
2. **Security Hardening**:
   - Creates a non-root system user `appuser` (UID 10001) so the container never runs as `root`.
   - Exposes port `8000` for FastAPI Uvicorn ASGI server.
3. **Container Hygiene (`.dockerignore`)**:
   - Excludes `.git`, `.venv`, `node_modules`, `terraform/`, and local temporary files to ensure minimal image size (<200 MB).

---

### STEP 2: Networking & Security Group Hierarchy (M2)

Everything in AWS requires a secure network foundation (VPC) before databases or servers can be created.

1. **Amazon VPC (`10.0.0.0/16`)**:
   - Creates an isolated Virtual Private Cloud across 2 Availability Zones (`us-east-1a`, `us-east-1b`).
2. **Subnet Segmentation**:
   - **Public Subnets (`10.0.1.0/24`, `10.0.2.0/24`)**: Connected to an **Internet Gateway (IGW)**. Holds the ALB and NAT Gateway.
   - **Private Subnets (`10.0.10.0/24`, `10.0.11.0/24`)**: Isolated from the internet. Holds ECS Fargate containers and RDS database.
3. **NAT Gateway**:
   - Placed in a Public Subnet with an Elastic IP. Allows private subnets (ECS containers) to send outbound traffic to pull container images or talk to AWS APIs without receiving unsolicited incoming internet traffic.
4. **Strict Security Group Rules**:
   - **ALB Security Group (`sg-alb`)**: Accepts incoming HTTP (Port 80) from any IP (`0.0.0.0/0`).
   - **ECS Security Group (`sg-ecs`)**: Accepts Port 8000 **ONLY** from `sg-alb`.
   - **RDS Security Group (`sg-rds`)**: Accepts PostgreSQL Port 5432 **ONLY** from `sg-ecs`.

---

### STEP 3: Database & Secrets Management (M3)

1. **AWS Secrets Manager (`tkt-poc-db-secret-*`)**:
   - Generates a random, 16-character secure database password and stores it safely.
2. **SSM Parameter Store (`/tkt-poc/config/*`)**:
   - Stores non-sensitive configuration settings (`AWS_REGION`, `APP_ENV`, `S3_BUCKET_NAME`).
3. **Amazon RDS PostgreSQL 15 (`tkt-poc-postgres`)**:
   - Provisioned in a Multi-AZ DB Subnet Group across private subnets.
   - `publicly_accessible = false` (cannot be accessed over the internet).
   - Storage encrypted at rest with AWS managed KMS keys (`storage_encrypted = true`).

---

### STEP 4: Amazon ECR & ECS Fargate Service (M1/M2)

1. **Amazon ECR Repository (`tkt-poc-ecr-api`)**:
   - Stores backend container images.
   - Configured with `image_tag_mutability = "IMMUTABLE"` to prevent overwriting existing release tags.
   - Automated vulnerability scanning on image push (`scan_on_push = true`).
2. **ECS Fargate Cluster & Task Definition**:
   - **Task Definition (`tkt-poc-task`)**: Defines 0.5 vCPU and 1 GB Memory. Resolves database credentials directly from Secrets Manager.
   - **Execution Role**: Granted `AmazonECSTaskExecutionRolePolicy` + Secrets Manager read permissions.
   - **Task Role**: Granted least-privilege S3 bucket access.
3. **ECS Service (`tkt-poc-service`)**:
   - Runs 1 continuous Fargate task in private subnets, registered to the ALB Target Group (`tkt-poc-tg`).

---

### STEP 5: Static Frontend Delivery & Global CDN (M4)

1. **Private S3 Frontend Bucket (`tkt-poc-frontend-4a79ac51`)**:
   - Blocks all public access (`aws_s3_bucket_public_access_block`).
   - Encrypted with SSE-S3.
2. **Amazon CloudFront Distribution (`d1od6yx769pvw2.cloudfront.net`)**:
   - Uses **Origin Access Control (OAC)** to securely read static HTML/JS/CSS files from private S3.
   - Configured with **Path Routing Rules**:
     - Default `/*`: Routes to S3 bucket (React SPA frontend).
     - `/api/*`: Proxies directly to ALB (`http://tkt-poc-alb-*.elb.amazonaws.com`).

---

### STEP 6: Serverless Direct File Uploads & Lambda (M5)

1. **Presigned Upload Workflow**:
   - When a user attaches a file, the React frontend calls `POST /api/tickets/{id}/presigned-upload`.
   - Backend API generates a temporary, signed AWS S3 PUT URL (`https://tkt-poc-attachments-4a79ac51.s3.amazonaws.com/uploads/...`).
   - Browser uploads the image directly to S3 without using API server bandwidth or memory.
2. **Serverless AWS Lambda Thumbnail Generator (`tkt-poc-thumbnail-generator`)**:
   - Configured with an S3 event notification (`s3:ObjectCreated`) on `uploads/` prefix.
   - When an image arrives in `uploads/`, S3 triggers Lambda automatically.
   - Lambda reads the image, resizes it to a **128x128 pixel thumbnail**, and writes it to `thumbnails/` in the S3 bucket.

---

### STEP 7: Automated CI/CD Pipeline (M6)

GitHub Actions workflow [`.github/workflows/deploy.yml`](https://github.com/Deepthi256/TicketDesk/blob/main/.github/workflows/deploy.yml) automates deployment on every `git push` to `main`:

1. **Job 1 (Build, Unit Test & Secret Scan)**:
   - Sets up Python 3.11 and runs unit tests.
   - Runs Gitleaks CLI secret scanner to prevent committing AWS credentials.
2. **Job 2 (Containerize & Deploy)**:
   - Authenticates to Amazon ECR.
   - Builds `linux/amd64` Docker image with `--provenance=false` tagged with git commit SHA.
   - Pushes image to ECR & updates ECS Task Definition.
   - Triggers zero-downtime rolling update on ECS Fargate.
   - Builds React frontend (`npm run build`), syncs `dist/` to S3, and flushes CloudFront edge cache.
   - Runs automated smoke test suite against live ALB URL.

---

### STEP 8: Operations, Alarms & Cost Management (M7/M8)

1. **CloudWatch Log Group (`/ecs/tkt-poc-api`)**:
   - Configured with finite 14-day retention.
2. **SNS Alerts Topic (`tkt-poc-alerts-topic`)**:
   - Notification target for alarms.
3. **CloudWatch Alarms**:
   - **`tkt-poc-alb-high-5xx-errors`**: Triggers if ALB 5xx errors > 5.
   - **`tkt-poc-alb-unhealthy-hosts`**: Triggers if unhealthy targets > 0.
   - **`tkt-poc-rds-high-cpu`**: Triggers if RDS CPU > 80%.
4. **CloudWatch Operations Dashboard (`tkt-poc-dashboard`)**:
   - Displays real-time ALB request counts, latency, ECS CPU/Memory, and RDS DB connections.
5. **Cost Optimization**:
   - Estimated monthly cost **~$38.47 USD** right-sized for 24/7 POC execution.

---

## 🔗 Quick Reference Service Connection Matrix

| Source Service | Target Service | Connection Method | Security Enforcement |
|---|---|---|---|
| **Browser** | **CloudFront CDN** | HTTPS (`https://d1od6yx769pvw2.cloudfront.net`) | SSL/TLS Encryption |
| **CloudFront** | **S3 Frontend** | S3 Origin Protocol | Origin Access Control (OAC) |
| **CloudFront** | **ALB** | HTTP (`/api/*`) | Custom Header / Load Balancer DNS |
| **ALB** | **ECS Fargate** | HTTP (Port 8000) | `sg-ecs` accepts Port 8000 ONLY from `sg-alb` |
| **ECS Fargate** | **RDS PostgreSQL** | TCP (Port 5432) | `sg-rds` accepts Port 5432 ONLY from `sg-ecs` |
| **ECS Fargate** | **Secrets Manager** | AWS IAM Execution Role | `secretsmanager:GetSecretValue` on secret ARN |
| **Browser** | **S3 Attachments** | S3 Presigned PUT URL | Expiring HMAC signature (1 hour) |
| **S3 Attachments** | **AWS Lambda** | `s3:ObjectCreated` Event | `lambda:InvokeFunction` permission |
