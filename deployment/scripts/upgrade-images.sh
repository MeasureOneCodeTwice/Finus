#!/bin/bash
sudo docker compose down
sudo docker rmi $(sudo docker images -a -q)
sudo docker compose up -d --pull always
