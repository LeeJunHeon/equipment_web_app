-- 장비별 구글챗 알림 on/off 플래그를 추가한다.
-- 켜진 장비에 새 이력(수리·Vent·클리닝)이 등록되면 구글챗 스페이스로 메시지를 보낸다.
-- 기존 장비는 알림이 갑자기 쏟아지지 않도록 기본값 false(꺼짐)로 둔다.
-- IF NOT EXISTS 를 써서 재실행해도 안전하다.

ALTER TABLE equipment.equipments
  ADD COLUMN IF NOT EXISTS chat_notify boolean NOT NULL DEFAULT false;
