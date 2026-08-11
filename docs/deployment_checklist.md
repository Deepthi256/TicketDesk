# Deployment Readiness Checklist Verification Matrix (34 / 34 Items)

This document verifies each of the 34 mandatory items required by the Capstone POC brief.

---

## 1. Container Hygiene (M1)

| # | Item | Status | Implementation Details / Reference |
|---|------|--------|------------------------------------|
| 1 | Multi-stage Dockerfile | ✅ PASS | `Dockerfile` features Stage 1 (Node builder), Stage 2 (Python wheel builder), Stage 3 (Slim runtime). |
| 2 | Container runs as non-root user | ✅ PASS | `Dockerfile` defines non-root user `appuser` (UID 10001) and group `appgroup`. |
| 3 | No SDK, compiler or build tools in final image | ✅ PASS | Compilers (`gcc`) installed only in builder stage; final image contains runtime libs (`libpq5`) only. |
| 4 | Image tagged with git commit SHA | ✅ PASS | `.github/workflows/deploy.yml` tags images with `${{ github.sha }}`. |
| 5 | Image scanning enabled on ECR | ✅ PASS | `terraform/ecs.tf` sets `scan_on_push = true` and `image_tag_mutability = "IMMUTABLE"`. |

---

## 2. Infrastructure as Code (M2)

| # | Item | Status | Implementation Details / Reference |
|---|------|--------|------------------------------------|
| 6 | Infrastructure defined in Terraform | ✅ PASS | 100% created via Terraform files in `terraform/` directory. |
| 7 | Remote backend state with locking | ✅ PASS | S3 backend with DynamoDB lock support configured in `terraform/main.tf`. |
| 8 | No hardcoded values (use variables) | ✅ PASS | Variable inputs parameterized in `terraform/variables.tf` and `terraform.tfvars`. |
| 9 | `terraform destroy` then `terraform apply` rebuilds stack cleanly | ✅ PASS | Fully automated and tested stateless infrastructure lifecycle. |

---

## 3. Network and Compute (M2)

| # | Item | Status | Implementation Details / Reference |
|---|------|--------|------------------------------------|
| 10 | Application container runs in private subnet | ✅ PASS | ECS service subnets set to `[aws_subnet.private_1.id, aws_subnet.private_2.id]`. |
| 11 | ALB sits in public subnet | ✅ PASS | ALB subnets set to `[aws_subnet.public_1.id, aws_subnet.public_2.id]`. |
| 12 | Security groups reference each other, no `0.0.0.0/0` internal rules | ✅ PASS | `terraform/security_groups.tf` references ALB SG ID in ECS SG, and ECS SG ID in RDS SG. |
| 13 | Health check endpoint configured and target group healthy | ✅ PASS | ALB Target group monitors HTTP port 8000 `/health` path. |
| 14 | At least two Availability Zones used | ✅ PASS | Subnets partitioned across `us-east-1a` and `us-east-1b`. |
| 15 | Application reachable through ALB URL | ✅ PASS | `aws_lb_listener` routes port 80 traffic to Target Group. |

---

## 4. Database and Configuration (M3)

| # | Item | Status | Implementation Details / Reference |
|---|------|--------|------------------------------------|
| 16 | Database in private subnet, `publicly_accessible = false` | ✅ PASS | `aws_db_instance.postgres` sets `publicly_accessible = false` in `aws_db_subnet_group.private`. |
| 17 | Database password in Secrets Manager | ✅ PASS | Password generated via `random_password` stored in `aws_secretsmanager_secret.db_credentials`. |
| 18 | Application config in Parameter Store | ✅ PASS | Configuration stored in SSM Parameter Store (`/tkt-poc/config/*`). |
| 19 | No credentials anywhere in repository | ✅ PASS | Verified via automated Gitleaks scanning in CI/CD pipeline. |
| 20 | Encryption at rest enabled on DB and buckets | ✅ PASS | RDS `storage_encrypted = true`, S3 buckets configured with AES256 server-side encryption. |
| 21 | Automated backups with non-zero retention | ✅ PASS | RDS configured with `backup_retention_period = 7`. |

---

## 5. Frontend and Serverless (M4 & M5)

| # | Item | Status | Implementation Details / Reference |
|---|------|--------|------------------------------------|
| 22 | Static frontend served through CloudFront; S3 bucket private | ✅ PASS | CloudFront with OAC fronts private frontend S3 bucket with public access blocked. |
| 23 | Attachments uploaded via presigned URL | ✅ PASS | `POST /api/tickets/{id}/presigned-upload` issues direct S3 presigned upload URLs. |
| 24 | Lambda triggered by S3 upload | ✅ PASS | `aws_s3_bucket_notification` triggers `thumbnail_generator.py` Lambda on `uploads/` object creation. |

---

## 6. Pipeline (M6)

| # | Item | Status | Implementation Details / Reference |
|---|------|--------|------------------------------------|
| 25 | Push to `main` deploys automatically | ✅ PASS | GitHub Actions `.github/workflows/deploy.yml` triggers on push to `main`. |
| 26 | Failing test or secret scan blocks deployment | ✅ PASS | Pipeline jobs `needs: build-and-test` fail fast on error. |
| 27 | Smoke test runs after deployment | ✅ PASS | Step runs `python Backend/tests/smoke_test.py --url` post-ECS deployment. |

---

## 7. Operations (M7)

| # | Item | Status | Implementation Details / Reference |
|---|------|--------|------------------------------------|
| 28 | Logs in CloudWatch with finite retention | ✅ PASS | `aws_cloudwatch_log_group.ecs_logs` configured with `retention_in_days = 14`. |
| 29 | Dashboard showing requests, errors, latency, CPU/memory | ✅ PASS | `aws_cloudwatch_dashboard.main` configured with 4 widgets. |
| 30 | Three working alarms wired to notification target | ✅ PASS | Alarms for ALB 5xx errors, Unhealthy Targets, and RDS High CPU wired to SNS topic. |

---

## 8. Housekeeping & Security (M8)

| # | Item | Status | Implementation Details / Reference |
|---|------|--------|------------------------------------|
| 31 | Every resource tagged (Project, Owner, Environment, CostCenter) | ✅ PASS | Default tags specified in provider block in `terraform/main.tf`. |
| 32 | IAM task role scoped strictly | ✅ PASS | `aws_iam_policy.ecs_task_permissions` explicitly scopes S3 bucket ARNs without `*`. |
| 33 | Cost within budget with cost report | ✅ PASS | Documented in `docs/cost_report.md`. |
| 34 | `README.md` allows deployment from scratch | ✅ PASS | Master step-by-step instructions in `README.md`. |
