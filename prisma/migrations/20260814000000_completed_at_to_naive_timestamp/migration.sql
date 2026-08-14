-- completed_at 을 occurred_at 과 동일한 기준(타임존 없는 timestamp, KST 벽시계)으로 변경한다.
-- 기존 값은 UTC 절대시각(timestamptz)이므로 KST 벽시계로 변환해 보존한다.
-- 이미 적용된 환경에서 재실행되어도 안전하도록 타입을 먼저 확인한다.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'equipment'
      AND table_name   = 'equipment_logs'
      AND column_name  = 'completed_at'
      AND data_type    = 'timestamp with time zone'
  ) THEN
    ALTER TABLE equipment.equipment_logs
      ALTER COLUMN completed_at TYPE timestamp(3)
      USING completed_at AT TIME ZONE 'Asia/Seoul';
  END IF;
END $$;
