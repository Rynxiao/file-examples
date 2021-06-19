#!/bin/sh

CONTAINER_NAME=file-db-dev

docker stop ${CONTAINER_NAME}
docker rm ${CONTAINER_NAME}