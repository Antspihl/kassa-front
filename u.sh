#!/usr/bin/env bash
set -euo pipefail

TAG="${1:-dev}"
PORT="${2:-3000}"
IMAGE_NAME="antspihl/kassa-front:${TAG}"
CONTAINER_NAME="kassa-front"
PORT_MAPPING="${PORT}:3000"

if docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  docker rm -f "${CONTAINER_NAME}"
fi

if docker images --format '{{.Repository}}:{{.Tag}}' | grep -qx "${IMAGE_NAME}"; then
  docker rmi -f "${IMAGE_NAME}"
fi

docker build -t "${IMAGE_NAME}" .
docker run -d -p "${PORT_MAPPING}" --name "${CONTAINER_NAME}" "${IMAGE_NAME}"
