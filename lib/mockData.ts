import type { Equipment, EquipmentLog } from "./types";

const EQUIPMENTS: Equipment[] = [
  { id: 1, name: "챔버 1 (CH1)", category: "PVD 스퍼터링", isVentTarget: true },
  { id: 2, name: "챔버 2 (CH2)", category: "PVD 스퍼터링", isVentTarget: true },
  { id: 3, name: "레이백", category: "로드락 장비", isVentTarget: true },
  { id: 4, name: "인라인 스퍼터", category: "인라인 장비", isVentTarget: true },
  { id: 5, name: "Evaporator", category: "박막 증착 장비", isVentTarget: false },
  { id: 6, name: "NCD", category: "CVD 장비", isVentTarget: false },
  { id: 7, name: "챔버 K", category: "스퍼터링", isVentTarget: false },
];

const LOGS: EquipmentLog[] = [
  { id: 1, equipmentId: 1, equipmentName: "챔버 1 (CH1)", eventType: "repair", occurredAt: "2026-04-15 09:30", operator: "이준헌", description: "Ar 가스 유량계 교체 진행 중. 공정 중 Ar 유량이 설정값 50sccm 대비 40~60sccm으로 불안정하게 변동. MFC 유량계 내부 필터 오염으로 판단.", photoCount: 2, status: "처리중", symptom: "Ar 가스 유량 불안정 (±20% 편차)", replacedParts: "MFC 유량계 (Ar 라인)", isExternal: false },
  { id: 2, equipmentId: 2, equipmentName: "챔버 2 (CH2)", eventType: "vent", occurredAt: "2026-04-14 14:00", operator: "박민준", description: "타겟 교체 후 재펌핑 완료.", photoCount: 0, status: "완료", ventReason: "타겟 교체", finalPressure: "3.2×10⁻⁶", pumpedDownAt: "2026-04-14 17:30" },
  { id: 3, equipmentId: 4, equipmentName: "인라인 스퍼터", eventType: "repair", occurredAt: "2026-04-13 11:00", operator: "이준헌", description: "러핑 펌프 오일 누유 발생. 외부 업체 점검 요청 중.", photoCount: 3, status: "처리중", symptom: "러핑 펌프 오일 누유", isExternal: true, vendorName: "한국진공기술" },
  { id: 4, equipmentId: 5, equipmentName: "Evaporator", eventType: "cleaning", occurredAt: "2026-04-12 10:00", operator: "박민준", description: "챔버 내부 Al 증착 잔여물 제거 완료.", photoCount: 0, status: "완료", cleaningType: "챔버 세정", nextScheduledAt: "2026-05-12" },
  { id: 5, equipmentId: 3, equipmentName: "레이백", eventType: "vent", occurredAt: "2026-04-10 09:00", operator: "이준헌", description: "월간 정기 Vent 완료.", photoCount: 0, status: "완료", ventReason: "정기 점검", finalPressure: "8.1×10⁻⁶", pumpedDownAt: "2026-04-10 12:00" },
  { id: 6, equipmentId: 1, equipmentName: "챔버 1 (CH1)", eventType: "repair", occurredAt: "2026-04-08 14:00", operator: "이준헌", description: "RF 전원공급장치 출력 케이블 불량 교체 완료.", photoCount: 1, status: "처리중", symptom: "RF 전원 출력 불안정", replacedParts: "RF 케이블", isExternal: false },
  { id: 7, equipmentId: 2, equipmentName: "챔버 2 (CH2)", eventType: "cleaning", occurredAt: "2026-04-02 10:00", operator: "박민준", description: "정기 챔버 클리닝 완료.", photoCount: 0, status: "완료", cleaningType: "정기 클리닝", nextScheduledAt: "2026-05-02" },
];

export { EQUIPMENTS, LOGS };
