#!/bin/sh

# close web & db service
docker-compose down
# remove web image
docker rmi file-upload_web