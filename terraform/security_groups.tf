# ALB Security Group (Public facing)
resource "aws_security_group" "alb" {
  name        = "${var.resource_prefix}-alb-sg"
  description = "Controls public HTTP ingress traffic to ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all egress traffic"
    from_port   = 0
    to_port     = 0
    protocol    ="-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.resource_prefix}-alb-sg"
  }
}

# ECS Security Group (Private subnet compute)
resource "aws_security_group" "ecs" {
  name        = "${var.resource_prefix}-ecs-sg"
  description = "Allows ingress traffic strictly from ALB security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow HTTP 8000 from ALB Security Group"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow egress to Internet/VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.resource_prefix}-ecs-sg"
  }
}

# Database Security Group (Private subnet RDS)
resource "aws_security_group" "rds" {
  name        = "${var.resource_prefix}-rds-sg"
  description = "Allows PostgreSQL ingress strictly from ECS security group"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow PostgreSQL 5432 from ECS Tasks Security Group"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  egress {
    description = "No outbound required for database"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = {
    Name = "${var.resource_prefix}-rds-sg"
  }
}
