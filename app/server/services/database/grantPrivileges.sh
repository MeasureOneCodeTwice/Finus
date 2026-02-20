#!/bin/bash
mysql -u root -p$MYSQL_ROOT_PASSWORD -e "
GRANT ALL PRIVILEGES ON finus.* TO '$MYSQL_USER'@'%';
"
