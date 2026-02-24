#!/bin/sh
#set -e
#mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "
# GRANT ALL PRIVILEGES ON finus.* TO '$MYSQL_USER'@'%';
# "

set -e

mysql -u root -p"$MYSQL_ROOT_PASSWORD" <<EOF
-- create user if it doesn't exist and grant privileges
CREATE USER IF NOT EXISTS '$MYSQL_USER'@'%' IDENTIFIED WITH mysql_native_password BY '$MYSQL_PASSWORD';


GRANT ALL PRIVILEGES ON finus.* TO '$MYSQL_USER'@'%';

FLUSH PRIVILEGES;
EOF

echo "Privileges granted successfully"