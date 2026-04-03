#!/bin/bash

quitting=false
quit() {
    if ! $quitting; then
        quitting=true
        cleanup
        exit 0
    fi
    return
}

cleanup() {
    echo "Cleaning up..."
    docker compose -f docker-compose.test.yml -f docker-compose.yml down
    return
}

waitforserviceshealthy() {
    source .env

    is_app_healthy() { 
        echo $(curl localhost:$API_GATEWAY_PORT/health 2> /dev/null | grep -Pc '^{(\"[^\"]*\":\"ok\",?)*}$')
        return
    }

    curr_checks=0
    max_checks=10
    while [[  healthy=$(is_app_healthy) -ne 1 ]] && [[  $curr_checks -lt $max_checks ]]; do
        curr_checks=$(($curr_checks + 1))
        sleep 2.5
        echo "App unhealthy. Retrying ($curr_checks of $max_checks)"
    done

    if [[  $healthy -ne 1 ]]; then
        echo "App unhealthy after $max_checks retries. Exiting"
        return 1
    fi
    return 0
}


trap quit SIGINT

echo "Building app images..."
docker compose build -q
status=$?
if [[  $status -ne 0 ]]; then
    echo "Failed to build services"
    exit $status
fi

echo "Building test images..."
docker compose -f docker-compose.test.yml build -q
status=$?
if [[  $status -ne 0 ]]; then
    echo "Failed to build test images"
    exit $status
fi

docker compose up -d
healthy=$(waitforserviceshealthy)
if [[ ! healthy ]]; then
    echo "Max retries exceeded. Exiting"
    exit 1
else 
    echo "Services healthy"
fi


docker compose -f docker-compose.test.yml up --abort-on-container-failure
test_status=$?

if [[  $test_status -eq 0 ]]; then
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
