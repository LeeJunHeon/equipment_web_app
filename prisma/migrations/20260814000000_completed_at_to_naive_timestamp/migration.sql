-- completed_at 을 occurred_at 과 동일한 기준(타임존 없는 timestamp, KST 벽시계)으로 변경한다.
-- 기존 값은 UTC 절대시각(timestamptz)이므로 KST 벽시계로 변환해 보존한다.
ALTER TABLE equipment.equipment_logs
  ALTER COLUMN completed_at TYPE timestamp(3)
  USING completed_at AT TIME ZONE 'Asia/Seoul';
