# 마이그레이션 적용 안내

이 프로젝트는 `npm run build` 가 `prisma generate && next build` 뿐이므로
**마이그레이션이 자동 적용되지 않는다.** 배포 전에 DBeaver 등에서 SQL을 직접 실행할 것.

## 순서
- 컬럼/테이블 **추가**: SQL 먼저 실행 → 코드 배포
  (코드가 먼저 올라가면 없는 컬럼/테이블을 조회해 500 발생)
- 값 **변경**(예: status 라벨): 순서 무관하나 간격을 짧게
  (비가동 계산은 equipment_downtimes 기준이라 수치는 흔들리지 않지만,
   그 사이 건수 뱃지가 0으로 보일 수 있음)

## Prisma가 관리하지 않는 DB 객체
`schema.prisma` 만 보고 판단하면 안 되는 것들. 값을 바꿀 때 반드시 함께 확인할 것.

| 제약명 | 대상 | 허용 값 |
|---|---|---|
| `equipment_logs_event_type_check` | `event_type` | repair, vent, cleaning |
| `equipment_logs_status_check` | `status` | 가동중, 정지중, 완료 |

확인 쿼리:

```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'equipment.equipment_logs'::regclass AND contype = 'c';
```

## 미정리 항목
- `equipment_logs.repair_started_at` — equipment_downtimes 로 대체되어 더 이상 쓰지 않음.
  롤백 대비로 남겨둔 상태. 안정화 확인 후 `ALTER TABLE ... DROP COLUMN` 으로 제거할 것.
