-- 수리 이력에 "실제로 장비를 세운 시각"(repair_started_at)을 추가한다.
-- 기존 비가동 계산은 occurred_at을 기점으로 썼으나, "수리필요"(가동 중 상태) 도입으로
-- 발견 시점과 정지 시점이 분리되었다. NULL이면 장비를 세운 적이 없다는 뜻이며 비가동 0으로 계산된다.
-- occurred_at / completed_at 과 동일한 기준(타임존 없는 timestamp, KST 벽시계).
-- 컬럼이 없을 때만 추가+백필하므로 재실행해도 안전하다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'equipment'
      AND table_name   = 'equipment_logs'
      AND column_name  = 'repair_started_at'
  ) THEN
    ALTER TABLE equipment.equipment_logs
      ADD COLUMN repair_started_at timestamp(3);

    -- 기존 수리 이력(48건)은 모두 "장비를 세우고 수리한" 건이므로
    -- occurred_at 을 그대로 정지 시점으로 백필한다. → 기존 가동률 수치가 그대로 유지된다.
    UPDATE equipment.equipment_logs
      SET repair_started_at = occurred_at
      WHERE event_type = 'repair';
  END IF;
END $$;
