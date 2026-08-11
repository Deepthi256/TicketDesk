output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "Public Application Load Balancer DNS Name"
  value       = aws_lb.main.dns_name
}

output "cloudfront_domain_name" {
  description = "CloudFront Distribution Domain Name"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "cloudfront_url" {
  description = "Public HTTPS CloudFront URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = aws_ecr_repository.api.repository_url
}

output "rds_endpoint" {
  description = "RDS PostgreSQL Endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "s3_frontend_bucket" {
  description = "S3 Bucket for Frontend Assets"
  value       = aws_s3_bucket.frontend.id
}

output "s3_attachments_bucket" {
  description = "S3 Bucket for Attachments"
  value       = aws_s3_bucket.attachments.id
}

output "cloudwatch_dashboard_name" {
  description = "CloudWatch Dashboard Name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}
