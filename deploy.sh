#!/bin/bash
# 장비관리(equipment-web) NAS 배포 스크립트. 사용법: bash deploy.sh
set -euo pipefail

APP_DIR="/volume1/docker/equipment-web"
SERVICE="nextjs"
CONTAINER="equipment-web-nextjs"
WAIT_SECONDS=60
WAIT_INTERVAL=5

# 컨테이너가 실행 중이면 0. 컨테이너가 아예 없을 때도 false 로 본다.
is_running() {
  [ "$(docker inspect -f '{{.State.Running}}' "$CONTAINER" 2>/dev/null || echo false)" = "true" ]
}

# 본문 전체를 함수로 감싸 둔다. git pull 이 실행 중에 이 파일을 바꿔도
# bash 는 이미 읽어 둔 함수로 끝까지 돌기 때문이다.
main() {
  # 폴더 소유자가 배포 계정과 달라 git 이 막히고(dubious ownership), 배포 계정은 홈 폴더가 없어
  # git 설정을 저장할 곳이 없다. root(HOME=/root)로 다시 실행해 root 의 git 설정을 쓴다.
  if [ "$(id -u)" -ne 0 ]; then
    exec sudo -H bash "$0" "$@"
  fi

  cd "$APP_DIR"

  echo "[1/4] git pull"
  # 같은 경로가 계속 쌓이지 않도록 목록에 없을 때만 추가한다.
  local safe_dirs
  safe_dirs="$(git config --global --get-all safe.directory || true)"
  if ! grep -qxF "$APP_DIR" <<<"$safe_dirs"; then
    git config --global --add safe.directory "$APP_DIR"
  fi
  git pull

  echo "[2/4] docker compose build $SERVICE"
  export BUILDX_GIT_INFO=0
  docker compose build "$SERVICE"

  # stop 을 하지 않는다. 이미지가 그대로일 때 stop 뒤 up -d 가 "Running" 만 찍고
  # 컨테이너를 켜지 않은 적이 있다. up -d 는 이미지가 바뀌면 알아서 컨테이너를 교체한다.
  echo "[3/4] docker compose up -d $SERVICE"
  docker compose up -d "$SERVICE"

  echo "[4/4] 실행 확인 (최대 ${WAIT_SECONDS}초)"
  local elapsed=0
  until is_running; do
    if [ "$elapsed" -eq 0 ]; then
      echo "컨테이너가 꺼져 있어 up -d 를 한 번 더 실행합니다."
      docker compose up -d "$SERVICE"
    fi
    if [ "$elapsed" -ge "$WAIT_SECONDS" ]; then
      docker ps -a --filter "name=$CONTAINER"
      docker logs --tail 30 "$CONTAINER" || true
      echo "배포 실패: 컨테이너가 실행 중이 아님"
      exit 1
    fi
    sleep "$WAIT_INTERVAL"
    elapsed=$((elapsed + WAIT_INTERVAL))
  done

  git log --oneline -1
  docker ps --filter "name=$CONTAINER" --format '{{.Names}}  {{.Status}}'
  echo "배포 완료!"
}

main "$@"
