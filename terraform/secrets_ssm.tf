# AWS Secrets Manager Secret for DB Password
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.resource_prefix}-db-secret-${random_id.bucket_suffix.hex}"
  recovery_window_in_days = 0

  tags = {
    Name = "${var.resource_prefix}-db-secret"
  }
}


resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    engine   = "postgres"
    host     = aws_db_instance.postgres.address
    port     = aws_db_instance.postgres.port
    username = aws_db_instance.postgres.username
    password = random_password.db_password.result
    dbname   = aws_db_instance.postgres.db_name
  })
}

# SSM Parameter Store Parameters
resource "aws_ssm_parameter" "app_env" {
  name        = "/${var.resource_prefix}/config/APP_ENV"
  description = "Application Environment"
  type        = "String"
  value       = var.environment
}

resource "aws_ssm_parameter" "aws_region" {
  name        = "/${var.resource_prefix}/config/AWS_REGION"
  description = "AWS Region"
  type        = "String"
  value       = var.aws_region
}

resource "aws_ssm_parameter" "s3_bucket" {
  name        = "/${var.resource_prefix}/config/S3_BUCKET_NAME"
  description = "Attachments S3 Bucket Name"
  type        = "String"
  value       = aws_s3_bucket.attachments.id
}
