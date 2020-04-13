#!/bin/bash

set -Eeo pipefail

sudo -E -u postgres docker-entrypoint.sh postgres &
db_pid=$!

PGPASSWORD=$POSTGRES_PASSWORD \
PGUSER=$POSTGRES_USER \
    node_modules/.bin/persea "$@" &
server_pid=$!

_shutdown() {
    kill -s SIGINT $server_pid
    kill -s SIGINT $db_pid
}

trap _shutdown SIGINT SIGTERM

wait $server_pid
wait $db_pid
