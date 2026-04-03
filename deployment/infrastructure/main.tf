provider "aws" {
  region = "us-east-2"
}

resource "aws_vpc" "finus" {
  cidr_block = "10.0.0.0/16"

  tags = {
    Name = "Finus"
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

resource "aws_security_group" "webserver" {
  name   = "finus-webserver"
  vpc_id = aws_vpc.finus.id

  ingress {
    description = "HTTP from anywhere"
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = "80"
    to_port     = "80"
    protocol    = "tcp"
  }
}

resource "aws_security_group" "services" {
  name   = "finus-services"
  vpc_id = aws_vpc.finus.id

  ingress {
    description = "TCP 3000 from anywhere"
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = "3000"
    to_port     = "3000"
    protocol    = "tcp"
  }
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

  ingress {
    description = "Docker webhook"
    cidr_blocks = ["0.0.0.0/0"]
    from_port   = "4444"
    to_port     = "4444"
    protocol    = "tcp"
  }

  egress {
    description      = "All outbound traffic"
    from_port        = "0"
    to_port          = "0"
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
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

  environment_name             = "prod"
  ssh_key_pair_name            = "finus-dev"
  security_group_ids           = [aws_security_group.default.id]
  webserver_security_group_ids = [aws_security_group.webserver.id]
  backend_security_group_ids   = [aws_security_group.services.id]
  subnet_id                    = aws_subnet.prod.id
  vpc_id                       = aws_vpc.finus.id
  gateway_id                   = aws_internet_gateway.default.id
  route_table_id               = aws_route_table.route_table.id
}
