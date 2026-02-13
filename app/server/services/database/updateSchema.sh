echo "Wipe database:"
mysql -c -h 127.0.0.1 -P 3306 -u root -p -e "DROP DATABASE finus"; 
echo "Load schema:"
mysql -c -h 127.0.0.1 -P 3306 -u root -p -e "$(cat schema.sql)"
