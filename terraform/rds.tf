# Random Password Generator for DB
resource "random_password" "db_password" {
  length           = 16
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

# DB Subnet Group (Private Subnets Only)
resource "aws_db_subnet_group" "private" {
  name        = "${var.resource_prefix}-db-subnet-group"
  subnet_ids  = [aws_subnet.private_1.id, aws_subnet.private_2.id]
  description = "DB Subnet Group in private subnets"

  tags = {
    Name = "${var.resource_prefix}-db-subnet-group"
  }
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier             = "${var.resource_prefix}-postgres"
  engine                 = "postgres"
  engine_version         = "15.4"
  instance_class         = "db.t4g.micro"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type           = "gp3"
  storage_encrypted      = true
  db_name                = "ticketdesk"
  username               = "dbadmin"
  password               = random_password.db_password.result
  db_subnet_group_name   = aws_db_subnet_group.private.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  skip_final_snapshot    = true

  backup_retention_period   = 7
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:30-Mon:05:30"
  deletion_protection       = false
  auto_minor_version_upgrade = true

  tags = {
    Name = "${var.resource_prefix}-postgres"
  }
}
