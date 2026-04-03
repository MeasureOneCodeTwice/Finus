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
variable "secondary_subnet_id" {
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
variable "db_username" {
  type      = string
  sensitive = true
}
variable "db_password" {
  type      = string
  sensitive = true
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

resource "aws_security_group" "db" {
  name   = "backend access"
  vpc_id = var.vpc_id

  ingress {
    cidr_blocks = [join("/", [aws_instance.backend.private_ip, "32"])]
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
  }
}

resource "aws_db_subnet_group" "default" {
  name       = "finus-${var.environment_name}-db-subnet-group"
  subnet_ids = [var.subnet_id, var.secondary_subnet_id]

  tags = {
    Name = "finus-${var.environment_name}-db-subnet-group"
  }
}
resource "aws_db_instance" "default" {
  allocated_storage = 5
  db_name           = "finus"
  engine            = "mysql"
  engine_version    = "8.0"
  instance_class    = "db.t3.micro"
  username          = var.db_username
  password          = var.db_password

  vpc_security_group_ids = [aws_security_group.db.id]
  db_subnet_group_name   = aws_db_subnet_group.default.name
}
