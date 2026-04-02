#!/bin/bash
sudo systemctl start docker
./upgrade-images.sh
tmux new-session -d -s upgrade-images 'node upgrade-on-new-image.js'
