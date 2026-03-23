provider "aws" {
  region = "us-east-2"
}

resource "aws_vpc" "finus" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "Finus2"
  }
}

resource "aws_subnet" "prod" {
  vpc_id     = aws_vpc.finus.id
  cidr_block = "10.0.0.0/17"
}

resource "aws_subnet" "dev" {
  vpc_id     = aws_vpc.finus.id
  cidr_block = "10.0.128.0/17"
}

resource "aws_internet_gateway" "default" {
  vpc_id = aws_vpc.finus.id
}

resource "aws_security_group" "default" {
  name   = "finus-default"
  vpc_id = aws_vpc.finus.id

  ingress {
    description = "SSH from anywhere"
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = "22"
    to_port     = "22"
    protocol    = "tcp"
  }

  egress {
    description = "HTTP from anywhere"
    from_port   = "3000"
    to_port     = "3000"
    protocol    = "tcp"
  }
}

resource "aws_route_table" "route_table" {
  vpc_id = aws_vpc.finus.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.default.id
  }
}

module "prod" {
  source = "./modules/finus"

  environment_name   = "prod"
  ssh_key_pair_name  = "finus-dev"
  security_group_ids = [aws_security_group.default.id]
  subnet_id          = aws_subnet.prod.id
  vpc_id             = aws_vpc.finus.id
  gateway_id         = aws_internet_gateway.default.id
  route_table_id     = aws_route_table.route_table.id
}


module "dev" {
  source = "./modules/finus"

  environment_name   = "dev"
  ssh_key_pair_name  = "finus-dev"
  security_group_ids = [aws_security_group.default.id]
  subnet_id          = aws_subnet.dev.id
  vpc_id             = aws_vpc.finus.id
  gateway_id         = aws_internet_gateway.default.id
  route_table_id     = aws_route_table.route_table.id
}
