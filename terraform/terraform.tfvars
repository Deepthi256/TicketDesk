aws_region          = "us-east-1"
resource_prefix     = "tkt-poc"
environment         = "dev"
container_image_tag = "v1.0.3"



default_tags = {
  Project     = "TicketDesk"
  Owner       = "CapstoneTeam"
  Environment = "Dev"
  CostCenter  = "POC-101"
}
