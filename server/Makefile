# Variables
APP_NAME=sse-status-server
DOCKER_USERNAME=isgogolgo13
DOCKER_REPO=$(DOCKER_USERNAME)/$(APP_NAME)
VERSION=latest

.PHONY: all build run test clean docker-build docker-push docker-deploy

all: build

build:
	@echo "Building $(APP_NAME)..."
	@go build -o bin/$(APP_NAME) svc/server.go

run:
	@echo "Running $(APP_NAME)..."
	@go run svc/server.go

test:
	@echo "Running tests..."
	@go test -v ./...

clean:
	@echo "Cleaning..."
	@rm -rf bin/

docker-build:
	@echo "Building Docker image..."
	@docker build -t $(DOCKER_REPO):$(VERSION) .

docker-login:
	@echo "Logging into Docker Hub..."
	@docker login

docker-tag:
	@echo "Tagging Docker image..."
	@docker tag $(DOCKER_REPO):$(VERSION) $(DOCKER_REPO):latest

docker-push: docker-login
	@echo "Pushing Docker image..."
	@docker push $(DOCKER_REPO):$(VERSION)
	@docker push $(DOCKER_REPO):latest

docker-deploy: docker-build docker-tag docker-push
	@echo "Deployment complete!"

docker-run:
	@echo "Running Docker container..."
	@docker run -p 8080:8080 $(DOCKER_REPO):$(VERSION)