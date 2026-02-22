#!/bin/sh
set -e

mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "
L PRIVILEGES ON finus.* TO '$MYSQL_USER'@'%';
"
