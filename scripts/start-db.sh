#!/bin/sh

SHELL_FOLDER=$PWD
CONTAINER_NAME=file-db-dev
MYSQL_ROOT_PASSWORD=pwd123
DATA_PATH=${SHELL_FOLDER}/data/mysql

if [ ! "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    if [ "$(docker ps -aq -f status=exited -f name=${CONTAINER_NAME})" ]; then
      # start container if stopped
      docker start ${CONTAINER_NAME}
    else
      # run container
      docker run \
      --name ${CONTAINER_NAME} \
      -v ${DATA_PATH}:/var/lib/mysql \
      -e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
      -p "3306:3306" \
      -d \
      mysql:8
    fi
fi