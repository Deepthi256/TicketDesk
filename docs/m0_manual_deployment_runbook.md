# Milestone M0 — Manual AWS Deployment Runbook & Resource Inventory

## Overview
This runbook documents the exact step-by-step process for manually deploying the TicketDesk application to AWS ECS Fargate behind an Application Load Balancer (ALB) via the AWS Management Console.

---

## 1. Inventory of AWS Resources Created

| # | Resource Type | Resource Name / Identifier | Purpose |
|---|---------------|----------------------------|---------|
| 1 | VPC | `tkt-vpc` (10.0.0.0/16) | Isolated network environment |
| 2 | Internet Gateway | `tkt-igw` | Gateway for public internet access |
| 3 | Public Subnet 1 | `tkt-public-subnet-1` (10.0.1.0/24 - us-east-1a) | Houses ALB Node 1 |
| 4 | Public Subnet 2 | `tkt-public-subnet-2` (10.0.2.0/24 - us-east-1b) | Houses ALB Node 2 |
| 5 | Private Subnet 1 | `tkt-private-subnet-1` (10.0.10.0/24 - us-east-1a) | Houses ECS Task 1 |
| 6 | Private Subnet 2 | `tkt-private-subnet-2` (10.0.20.0/24 - us-east-1b) | Houses ECS Task 2 |
| 7 | NAT Gateway | `tkt-nat-gw` | Egress internet access for private containers |
| 8 | Route Tables | `tkt-public-rt`, `tkt-private-rt` | Routing traffic to IGW and NAT GW |
| 9 | Security Group (ALB) | `tkt-alb-sg` | Inbound HTTP 80 from `0.0.0.0/0` |
| 10 | Security Group (ECS) | `tkt-ecs-sg` | Inbound HTTP 8000 strictly from `tkt-alb-sg` |
| 11 | ECR Repository | `tkt-ecr-backend` | Container image repository |
| 12 | IAM Execution Role | `ecsTaskExecutionRole` | Permission for ECS to pull ECR image & CloudWatch logs |
| 13 | IAM Task Role | `tkt-ecs-task-role` | Permission for backend code to access AWS services |
| 14 | Target Group | `tkt-tg-backend` (IP target, Port 8000, `/health`) | Route ALB traffic to tasks |
| 15 | Application Load Balancer | `tkt-alb` | Entrypoint for public web traffic |
| 16 | ECS Cluster | `tkt-cluster` | Container orchestration cluster |
| 17 | ECS Task Definition | `tkt-backend-task:1` | Fargate spec (0.5 vCPU, 1GB RAM, container def) |
| 18 | ECS Service | `tkt-backend-service` | Runs and maintains desired task count |

---

## 2. Step-by-Step Manual Deployment Walkthrough

### Step 1: Networking Setup (VPC & Subnets)
1. Navigate to **VPC Console** → Create VPC `tkt-vpc` with IPv4 CIDR `10.0.0.0/16`.
2. Create 2 public subnets (`10.0.1.0/24`, `10.0.2.0/24`) and 2 private subnets (`10.0.10.0/24`, `10.0.20.0/24`) across `us-east-1a` and `us-east-1b`.
3. Create Internet Gateway `tkt-igw` and attach to `tkt-vpc`.
4. Create Route Table `tkt-public-rt`, add route `0.0.0.0/0` → `tkt-igw`, and associate public subnets.
5. Create NAT Gateway `tkt-nat-gw` in public subnet 1, create `tkt-private-rt` pointing `0.0.0.0/0` → NAT GW, and associate private subnets.

### Step 2: Security Groups
1. Create `tkt-alb-sg`: Inbound HTTP 80 from `0.0.0.0/0`.
2. Create `tkt-ecs-sg`: Inbound TCP 8000 with source set to `tkt-alb-sg` ID.

### Step 3: Container Image (ECR)
1. Navigate to **ECR Console** → Create repository `tkt-ecr-backend`.
2. Build local docker image: `docker build -t tkt-backend:v1 .`
3. Authenticate Docker to ECR, tag, and push image:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com
   docker tag tkt-backend:v1 <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/tkt-ecr-backend:v1
   docker push <aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/tkt-ecr-backend:v1
   ```

### Step 4: Load Balancer & Target Group
1. Navigate to **EC2 Console** → **Target Groups** → Create target group `tkt-tg-backend`:
   - Target type: `IP`
   - Protocol: `HTTP`, Port: `8000`
   - Health check path: `/health`
2. Navigate to **Load Balancers** → Create Application Load Balancer `tkt-alb`:
   - Scheme: Internet-facing
   - Subnets: `tkt-public-subnet-1`, `tkt-public-subnet-2`
   - Security Group: `tkt-alb-sg`
   - Listener: HTTP 80 forwarding to `tkt-tg-backend`.

### Step 5: ECS Fargate Cluster & Service
1. Navigate to **ECS Console** → Create Cluster `tkt-cluster` (Fargate).
2. Create Task Definition `tkt-backend-task`:
   - Launch type: Fargate (0.5 vCPU / 1 GB RAM)
   - Task execution role: `ecsTaskExecutionRole`
   - Container name: `backend`
   - Image: `<aws_account_id>.dkr.ecr.us-east-1.amazonaws.com/tkt-ecr-backend:v1`
   - Port mapping: `8000`
3. Create Service `tkt-backend-service`:
   - Desired tasks: 1
   - VPC: `tkt-vpc`, Subnets: Private Subnet 1 & Private Subnet 2
   - Security Group: `tkt-ecs-sg`
   - Load Balancer: `tkt-alb`, Target Group: `tkt-tg-backend`.

### Step 6: Verification
1. Copy the DNS name of `tkt-alb` (e.g. `http://tkt-alb-123456789.us-east-1.elb.amazonaws.com`).
2. Test health endpoint: `curl http://<alb-dns>/health`. Should return `{"status":"healthy"}`.
