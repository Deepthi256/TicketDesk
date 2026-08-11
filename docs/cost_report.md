# TicketDesk AWS POC — One-Page Cost Breakdown Report

## Executive Summary
This report summarizes the estimated monthly and daily expenditure for running the TicketDesk infrastructure on AWS based on Foundation level usage patterns. All resources have been right-sized for cost efficiency while upholding high availability and production security guidelines.

---

## Service Cost Analysis Breakdown

| AWS Service | Resource Spec / Tier | Qty / Usage | Estimated Monthly Cost (USD) | Cost Share % |
|-------------|----------------------|-------------|------------------------------|--------------|
| **Amazon RDS** | `db.t4g.micro` (PostgreSQL), 20 GB gp3 | 1 instance | $14.60 | 38.5% |
| **AWS Fargate (ECS)** | 0.5 vCPU, 1 GB RAM (24/7) | 1 task | $12.40 | 32.7% |
| **NAT Gateway** | 1 NAT GW (Public Subnet) | 1 GW (~730 hrs) | $8.70 | 23.0% |
| **Application Load Balancer** | ALB (2 AZs) + LCU traffic | 1 ALB | $2.10 | 5.5% |
| **Amazon S3** | Static Web + Attachments (<5 GB) | 2 buckets | $0.12 | 0.3% |
| **Amazon CloudFront** | Data Transfer Out (<10 GB) | 1 distribution | $0.00 (Free Tier) | 0.0% |
| **AWS Secrets Manager** | 1 Database Secret | 1 secret | $0.40 | 1.0% |
| **AWS Lambda** | 128MB Thumbnail Generator (<100K calls) | 1 function | $0.00 (Free Tier) | 0.0% |
| **Amazon CloudWatch** | Logs (14-day retention, <1GB) + Alarms | 1 Log Group + 3 Alarms | $0.15 | 0.4% |
| **TOTAL ESTIMATED MONTHLY SPEND** | | | **~$38.47 USD** | **100%** |

---

## Top 2 Most Expensive Resources
1. **Amazon RDS PostgreSQL (`db.t4g.micro`)**: ~$14.60/mo — Essential for relational state persistence in private subnets.
2. **AWS Fargate Container Task**: ~$12.40/mo — Runs containerized API server 24/7.

---

## Cost Optimization Recommendations
1. **Scheduled Shutdown**: Implement automated night/weekend ECS task scaling down to `0` desired count to save ~60% on compute cost.
2. **NAT Gateway Alternatives**: For local/POC environments, replace single NAT Gateway with VPC Endpoints for S3, ECR, and Secrets Manager to eliminate per-hour NAT charges.
