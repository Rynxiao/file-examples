#!/bin/sh

SHELL_FOLDER=$PWD
CONTAINER_NAME=file-db-dev
MYSQL_ROOT_PASSWORD=pwd123
DATA_PATH=${SHELL_FOLDER}/data/mysql

docker run \
--name ${CONTAINER_NAME} \
-v ${DATA_PATH}:/var/lib/mysql \
-e MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD} \
-p "3306:3306" \
-d \
mysql:8