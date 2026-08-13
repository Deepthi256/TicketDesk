# TicketDesk CI/CD Automated Deployment Pipeline Guide

---

## 📌 Executive Summary

The TicketDesk CI/CD pipeline automates testing, security scanning, container packaging, infrastructure deployment, static web delivery, and live validation. Powered by **GitHub Actions**, any developer pushing code changes to the `main` branch automatically triggers a zero-downtime full-stack deployment to **Amazon Web Services (AWS)**.

🔗 **GitHub Repository**: [`https://github.com/Deepthi256/TicketDesk`](https://github.com/Deepthi256/TicketDesk)  
📄 **Workflow Configuration File**: [`.github/workflows/deploy.yml`](https://github.com/Deepthi256/TicketDesk/blob/main/.github/workflows/deploy.yml)

---

## 🌐 End-to-End Pipeline Flow Diagram

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │ 1. DEVELOPER PUSHES CODE TO MAIN BRANCH (git push origin main)         │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ JOB 1: BUILD, UNIT TEST & SECRET SCAN (26 Seconds)                      │
  │  ├── 🐍 Set up Python 3.11 & Install Dependencies                      │
  │  ├── 🧪 Run Pytest Unit Test Suite (Backend/tests/)                    │
  │  └── 🛡️ Run Gitleaks CLI Directory Secret Scanner                      │
  └───────────────────────────────────┬────────────────────────────────────┘
                                      │ (Passes 100%)
                                      ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │ JOB 2: CONTAINERISE, PUSH ECR & DEPLOY ECS FARGATE (3 Minutes 40 Sec) │
  │  ├── 🔑 Authenticate to AWS & Amazon ECR (us-east-1)                   │
  │  ├── 🐳 Build Docker linux/amd64 Container (provenance=false)           │
  │  ├── 📦 Push Immutable Container Tag (Commit SHA) to ECR               │
  │  ├── 🚀 Deploy Zero-Downtime Task Revision to ECS Fargate               │
  │  ├── 💻 Build React Bundle (npm run build) & Sync to S3                │
  │  ├── ⚡ Invalidate CloudFront CDN Cache (E12697VRFKPWD1)               │
  │  └── 🧪 Run Live E2E Smoke Tests against ALB Endpoint                  │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 🔑 Required Repository Secrets & Variables

To enable automated AWS deployment, the following secrets must be configured under **GitHub Repository Settings → Secrets and variables → Actions**:

| Secret / Variable Name | Description | Example Value |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | AWS IAM User Access Key ID | `AKIARN...` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM User Secret Access Key | `F6w8r...` |
| `AWS_REGION` | Target AWS Region | `us-east-1` |
| `ECR_REPOSITORY` | Amazon ECR Repository Name | `tkt-poc-ecr-api` |
| `ECS_CLUSTER` | ECS Fargate Cluster Name | `tkt-poc-cluster` |
| `ECS_SERVICE` | ECS Fargate Service Name | `tkt-poc-service` |

---

## ⚙️ Detailed Pipeline Stages & Execution Logic

---

### JOB 1: `1. Build, Unit Test & Secret Scan`

- **Purpose**: Validates application code quality and verifies that no sensitive AWS keys or secrets are committed before any cloud resources are modified.
- **Runner**: `ubuntu-latest`
- **Execution Steps**:
  1. **Checkout Code**: Uses `actions/checkout@v4` with `fetch-depth: 0` to retrieve complete repository context.
  2. **Python Environment Setup**: Configures Python 3.11 runtime.
  3. **Dependency Installation**: Installs backend Python dependencies (`Backend/requirements.txt`), `pytest`, and `httpx`.
  4. **Automated Unit Testing**: Runs `pytest Backend/tests/` to verify route handlers and logic contracts.
  5. **Directory Secret Scanning**: Downloads the official **Gitleaks CLI v8.18.2** and executes:
     ```bash
     ./gitleaks detect --source=. --no-git --redact -v
     ```
     Scans the entire repository tree for leaked API keys, tokens, and password strings.

---

### JOB 2: `2. Containerise, Push ECR & Deploy ECS Fargate`

- **Purpose**: Packages the backend into a Docker container, deploys it to ECS Fargate, compiles the React frontend, syncs static assets to S3, invalidates CloudFront CDN, and runs live smoke tests.
- **Dependency**: `needs: build-and-test` (Executes **ONLY IF** Job 1 succeeds).
- **Execution Steps**:
  1. **AWS Authentication**: Uses `aws-actions/configure-aws-credentials@v4` to assume IAM identity.
  2. **Amazon ECR Login**: Uses `aws-actions/amazon-ecr-login@v2` to get Docker registry authorization tokens.
  3. **Docker Buildx Setup**: Sets up Docker Buildx (`docker/setup-buildx-action@v3`).
  4. **Container Build & ECR Push**:
     ```bash
     repo_url="$ECR_REGISTRY/$ECR_REPOSITORY"
     docker buildx build --platform linux/amd64 --provenance=false --push -t $repo_url:$IMAGE_TAG .
     ```
     *Note*: Uses `--provenance=false` to generate clean OCI single-architecture manifests accepted by Amazon ECR, tagging with the unique Git commit SHA (`$IMAGE_TAG`) to honor ECR immutability rules.
  5. **Task Definition Download & Render**: Downloads current active task definition from ECS (`tkt-poc-task`) and updates the container image output tag.
  6. **Zero-Downtime ECS Fargate Service Deployment**:
     - Deploys new task definition to `tkt-poc-service`.
     - `wait-for-service-stability: true`: Waits for ALB target group health checks to verify HTTP 200 OK responses before draining older containers.
  7. **React Frontend Compilation & S3 Deployment**:
     ```bash
     cd Frontend
     npm install
     npm run build
     cd ..
     aws s3 sync Frontend/dist/ s3://tkt-poc-frontend-4a79ac51/ --delete
     aws cloudfront create-invalidation --distribution-id E12697VRFKPWD1 --paths "/*"
     ```
     Compiles React Vite bundle, uploads static assets to private S3, and flushes CloudFront edge caches worldwide.
  8. **Automated Smoke Testing**:
     Resolves ALB DNS Name via AWS CLI and runs end-to-end integration tests (`python Backend/tests/smoke_test.py --url "http://$ALB_URL"`).

---

## 🛠️ Common Pipeline Issues & Solutions Reference

| Issue / Error Symptom | Root Cause | Resolution Applied |
|---|---|---|
| `fatal: ambiguous argument... unknown revision` in Gitleaks | Shallow git clone (`fetch-depth: 1`) missing parent commits | Added `with: fetch-depth: 0` to checkout steps |
| `tag invalid: The image tag 'latest' already exists...` | ECR repository mutability rule prevents overwriting `:latest` | Tagged container images strictly with unique `$IMAGE_TAG` |
| `400 Bad Request` during `docker push` | Docker BuildKit generated multi-manifest provenance index | Added `--provenance=false --platform linux/amd64` to `docker buildx` |
| CloudFront users seeing old cached React code | Static web assets cached at global edge locations | Added `aws cloudfront create-invalidation --paths "/*"` step |
