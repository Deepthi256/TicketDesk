variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "resource_prefix" {
  description = "Resource prefix for all created AWS components"
  type        = string
  default     = "tkt-poc"
}

variable "environment" {
  description = "Environment identifier (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "container_image_tag" {
  description = "Docker image commit SHA tag to deploy"
  type        = string
  default     = "latest"
}

variable "default_tags" {
  description = "Mandatory resource tags for compliance"
  type        = map(string)
  default = {
    Project     = "TicketDesk"
    Owner       = "CapstoneTeam"
    Environment = "Dev"
    CostCenter  = "POC-101"
  }
}
