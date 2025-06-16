# Variables
APP_NAME=sse-status-client
DOCKER_USERNAME=isgogolgo13
DOCKER_REPO=$(DOCKER_USERNAME)/$(APP_NAME)
VERSION=latest

.PHONY: all install build start test clean docker-build docker-push docker-deploy

all: install build

install:
	@echo "Installing dependencies..."
	@npm install

build:
	@echo "Building $(APP_NAME)..."
	@npm run build

start:
	@echo "Starting $(APP_NAME) development server..."
	@npm start

test:
	@echo "Running tests..."
	@npm test -- --watchAll=false

clean:
	@echo "Cleaning..."
	@rm -rf build/ node_modules/

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
	@echo "Client deployment complete!"

docker-run:
	@echo "Running Docker container..."
	@docker run -p 3000:3000 $(DOCKER_REPO):$(VERSION)

dev:
	@echo "Starting development environment..."
	@npm start