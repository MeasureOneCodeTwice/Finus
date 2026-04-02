#!/bin/bash
install() {
    test -f "$(which $1 2>&1)"
    if [[ ! $? -eq 0 ]]; then
        echo "Installing $1"
        sudo yum install $2 -y
    else 
        echo "$1 already installed"
    fi
}

install docker docker
install node nodejs 
install tmux tmux

docker compose > /dev/null
if [[ ! $? -eq 0 ]]; then
    echo "Installing docker compose"
    #from https://gist.github.com/thimslugga/36019e15b2a47a48c495b661d18faa6d
    sudo mkdir -p /usr/local/lib/docker/cli-plugins
    sudo curl -sL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-"$(uname -m)" \
      -o /usr/local/lib/docker/cli-plugins/docker-compose
    # Set ownership to root and make executable
    test -f /usr/local/lib/docker/cli-plugins/docker-compose \
      && sudo chown root:root /usr/local/lib/docker/cli-plugins/docker-compose
    test -f /usr/local/lib/docker/cli-plugins/docker-compose \
      && sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
else 
    echo "Docker compose already installed"
fi
