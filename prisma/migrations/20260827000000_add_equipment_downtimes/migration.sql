-- 한 수리 건에서 장비가 선 구간은 여러 번 생길 수 있다(세움 → 임시 가동 → 다시 세움).
-- repair_started_at 컬럼 하나로는 이를 담을 수 없어 이전 정지 이력이 덮어써지므로
-- 정지 구간을 별도 테이블로 분리한다.
-- started_at / ended_at 은 occurred_at 과 동일 기준(타임존 없는 timestamp, KST 벽시계).
-- ended_at IS NULL = 지금도 정지 중.
CREATE TABLE IF NOT EXISTS equipment.equipment_downtimes (
  id         serial PRIMARY KEY,
  log_id     integer NOT NULL REFERENCES equipment.equipment_logs(id) ON DELETE CASCADE,
  started_at timestamp(3) NOT NULL,
  ended_at   timestamp(3),
  created_at timestamp(3) NOT NULL DEFAULT (NOW() AT TIME ZONE 'Asia/Seoul')
);

CREATE INDEX IF NOT EXISTS equipment_downtimes_log_id_idx
  ON equipment.equipment_downtimes(log_id);

-- 기존 데이터 이관. 비어 있을 때만 실행하므로 재실행해도 중복되지 않는다.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM equipment.equipment_downtimes) THEN
    INSERT INTO equipment.equipment_downtimes (log_id, started_at, ended_at)
    SELECT id, repair_started_at, completed_at
    FROM equipment.equipment_logs
    WHERE event_type = 'repair'
      AND repair_started_at IS NOT NULL
      -- 완료인데 completed_at 이 없는 과거 행(36건)은 종료 시각을 알 수 없다.
      -- 현재 대시보드도 이 행들을 비가동 계산에서 제외하고 있으므로(0h),
      -- 구간을 만들지 않아야 기존 수치가 그대로 유지된다.
      -- 여기서 구간을 만들면 ended_at 이 NULL 이 되어 "지금도 정지 중"으로 잘못 계산된다.
      AND (status = '처리중' OR completed_at IS NOT NULL);
  END IF;
END $$;
