# Makefile for Docker Infrastructure as Code Management

# Set the default Docker image name
IMAGE_NAME = my_docker_image

# Set the default container name
CONTAINER_NAME = my_container

# Build the Docker image
build:
	docker build -t $(IMAGE_NAME) .

# Run the Docker container
run:
	docker run --name $(CONTAINER_NAME) -d $(IMAGE_NAME)

# Stop the Docker container
stop:
	docker stop $(CONTAINER_NAME)

# Remove the Docker container
rm:
	docker rm $(CONTAINER_NAME)

# Remove the Docker image
rmi:
	docker rmi $(IMAGE_NAME)

# Show the Docker logs for the container
logs:
	docker logs $(CONTAINER_NAME)

# Execute a command inside the running container
exec:
	docker exec -it $(CONTAINER_NAME) /bin/sh

# Clean up all stopped containers and unused images
cleanup:
	docker container prune -f
	docker image prune -f

# View available Docker images
images:
	docker images

# View running containers
ps:
	docker ps

# Pull the latest image from the repository
pull:
	docker pull $(IMAGE_NAME)

# Push the Docker image to a remote repository
push:
	docker push $(IMAGE_NAME)