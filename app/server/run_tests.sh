#!/bin/bash

quitting=false
quit() {
    if ! $quitting; then
        quitting=true
        cleanup
        exit 0
    fi
}
cleanup() {
    echo "Cleaning up..."
    docker compose -f docker-compose.test.yml -f docker-compose.yml down
}
trap quit SIGINT

#--- Build images ---
echo "Building app images..."
docker compose build -q
status=$?
if [ $status -ne 0 ]; then
    echo "Failed to build services"
    exit $status
fi

echo "Building test images..."
docker compose -f docker-compose.test.yml build -q
status=$?
if [ $status -ne 0 ]; then
    echo "Failed to build test images"
    exit $status
fi

#--- Launch services ---
docker compose up -d

#--- Wait for services to be healthy ---
source .env

is_app_healthy() { 
    echo $(curl localhost:$API_GATEWAY_PORT/health 2> /dev/null | grep -Pc '^{(\"[^\"]*\":\"ok\",?)*}$')
}

curr_checks=0
max_checks=10
while [[  healthy=$(is_app_healthy) -ne 1 ]] && [ $curr_checks -lt $max_checks ]; do
    curr_checks=$(($curr_checks + 1))
    sleep 2.5
    echo "App unhealthy. Retrying ($curr_checks of $max_checks)"
done

if [ $healthy -ne 1 ]; then
    echo "App unhealthy after $max_checks retries. Exiting"
    exit 1
fi

#--- Run tests ---
docker compose -f docker-compose.test.yml up --abort-on-container-failure
test_status=$?

if [ $test_status -eq 0 ]; then
    echo '+--------------------+'
    echo '| ✅ All tests pass! |'
    echo '+--------------------+'
else 
    echo '+--------------------+'
    echo '|  ❌ Tests failed   |'
    echo '+--------------------+'

fi
cleanup

exit $test_status
