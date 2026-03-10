# Makefile for Docker Management

# Build the Docker image
build:
	docker build -t my-image .

# Run the Docker container
run:
	docker run -d -p 8080:80 my-image

# Stop the Docker container
stop:
	docker stop $(docker ps -q --filter ancestor=my-image)

# Remove the Docker container
rm:
	docker rm $(docker ps -aq --filter ancestor=my-image)

# Remove the Docker image
rmi:
	docker rmi my-image