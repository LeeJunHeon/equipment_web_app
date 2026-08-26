-- 수리 상태 라벨을 "가동/정지" 축으로 통일한다.
-- 수리필요 → 가동중 (수리 필요하지만 장비는 돌고 있음)
-- 처리중   → 정지중 (장비를 세우고 수리 중)
--
-- 주의: equipment_logs.status 에는 Prisma가 관리하지 않는 CHECK 제약
-- equipment_logs_status_check 가 걸려 있다(옛 값 '처리중','완료'만 허용).
-- 제약을 먼저 제거하지 않으면 UPDATE 가 실패하므로 순서를 지킬 것.
-- 모든 구문이 IF EXISTS / WHERE 조건을 가져 재실행해도 안전하다.

BEGIN;

ALTER TABLE equipment.equipment_logs
  DROP CONSTRAINT IF EXISTS equipment_logs_status_check;

UPDATE equipment.equipment_logs SET status = '가동중' WHERE status = '수리필요';
UPDATE equipment.equipment_logs SET status = '정지중' WHERE status = '처리중';

ALTER TABLE equipment.equipment_logs
  ALTER COLUMN status SET DEFAULT '정지중';

ALTER TABLE equipment.equipment_logs
  ADD CONSTRAINT equipment_logs_status_check
  CHECK (status IN ('가동중', '정지중', '완료'));

COMMIT;
