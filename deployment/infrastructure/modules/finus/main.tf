variable "environment_name" {
  type = string
}
variable "ssh_key_pair_name" {
  type = string
}
variable "security_group_ids" {
  type = list(string)
}
variable "webserver_security_group_ids" {
  type = list(string)
}
variable "backend_security_group_ids" {
  type = list(string)
}
variable "subnet_id" {
  type = string
}
variable "vpc_id" {
  type = string
}
variable "gateway_id" {
  type = string
}
variable "route_table_id" {
  type = string
}


data "aws_ami" "amazon_linux" {
  filter {
    name   = "image-id"
    values = ["ami-0b0b78dcacbab728f"]
  }
}


resource "aws_instance" "backend" {
  instance_type          = "t2.nano"
  ami                    = data.aws_ami.amazon_linux.id
  subnet_id              = var.subnet_id
  key_name               = var.ssh_key_pair_name
  vpc_security_group_ids = concat(var.security_group_ids, var.backend_security_group_ids)

  tags = {
    Name = join("", ["finus-", var.environment_name, "-backend"])
  }
}

resource "aws_instance" "webserver" {
  instance_type          = "t2.nano"
  ami                    = data.aws_ami.amazon_linux.id
  subnet_id              = var.subnet_id
  key_name               = var.ssh_key_pair_name
  vpc_security_group_ids = concat(var.security_group_ids, var.webserver_security_group_ids)

  tags = {
    Name = join("", ["finus-", var.environment_name, "-webserver"])
  }
}

resource "aws_route_table_association" "assoc" {
  subnet_id      = var.subnet_id
  route_table_id = var.route_table_id
}

resource "aws_eip" "backend" {
  instance = aws_instance.backend.id
  domain   = "vpc"

  tags = {
    Name = join("", ["finus-", var.environment_name, "-backend"])
  }
}

resource "aws_eip" "webserver" {
  instance = aws_instance.webserver.id
  domain   = "vpc"

  tags = {
    Name = join("", ["finus-", var.environment_name, "-webserver"])
  }
}
