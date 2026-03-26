#!/bin/bash
./upgrade-images.sh
tmux new-session -d -s upgrade-images 'node upgrade-on-new-image.js'
