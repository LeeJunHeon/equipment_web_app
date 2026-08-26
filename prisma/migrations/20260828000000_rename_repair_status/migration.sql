-- 수리 상태 라벨을 "가동/정지" 축으로 통일한다.
-- 수리필요 → 가동중 (수리 필요하지만 장비는 돌고 있음)
-- 처리중   → 정지중 (장비를 세우고 수리 중)
-- WHERE 조건이 있어 재실행해도 안전하다.
UPDATE equipment.equipment_logs SET status = '가동중' WHERE status = '수리필요';
UPDATE equipment.equipment_logs SET status = '정지중' WHERE status = '처리중';

ALTER TABLE equipment.equipment_logs ALTER COLUMN status SET DEFAULT '정지중';
