# syntax=docker/dockerfile:1

Build:
  docker build -f infra/Dockerfile -t invenzo:latest .

Run (single command):
  docker run --name invenzo -p 8080:80 -p 5432:5432 -p 6379:6379 -v invenzo_pg:/var/lib/postgresql/data -v invenzo_redis:/var/lib/redis invenzo:latest

App URL:
  http://localhost:8080
