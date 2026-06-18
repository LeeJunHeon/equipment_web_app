// lib/operation-schemas.ts
// 장비관리 챗봇 작업 정의. 재고앱 operation-schemas.ts와 동일한 형식.

export type FieldType =
  | "id_ref"    // 마스터 ID. LLM은 이름, 시스템이 ID 확정 (lookup 사용)
  | "number"
  | "date"
  | "text"
  | "enum"
  | "barcode";

export interface SchemaField {
  name: string;
  label: string;
  type: FieldType;
  required: boolean;
  lookup?: string;
  validation?: string;
  auto?: "today" | "system_generate";
  enumValues?: string[];
}

export interface SchemaStep {
  api: string;
  body: string[];
  returns?: string;
}

export interface OperationSchema {
  id: string;
  label: string;
  description: string;
  triggers: string[];
  app: "equipment";          // 포털이 확인 후 어느 쓰기 프록시로 보낼지 라우팅
  appliesWhen?: { categoryName: string };
  fields: SchemaField[];
  steps: SchemaStep[];
  cardTitle: string;
  cardShow: string[];
}

export const OPERATION_SCHEMAS: OperationSchema[] = [
  {
    id: "equipment_repair",
    label: "장비 수리 등록",
    description: "장비 수리 이력을 등록한다. 증상/조치내용/상태(처리중·완료)를 기록한다.",
    triggers: ["수리 등록", "수리했어", "고쳤어", "장비 수리", "수리 기록"],
    app: "equipment",
    fields: [
      { name: "equipmentId",   label: "장비",       type: "id_ref", required: true, lookup: "list_equipment" },
      { name: "symptom",       label: "증상",       type: "text",   required: false },
      { name: "description",   label: "조치 내용",  type: "text",   required: true },
      { name: "status",        label: "상태",       type: "enum",   required: false, enumValues: ["처리중", "완료"],
        validation: "수리가 끝났으면 '완료', 진행 중이면 '처리중'. 사용자가 완료/끝났다고 하면 '완료', 아니면 '처리중'(기본)." },
      { name: "replacedParts", label: "교체 부품",  type: "text",   required: false },
      { name: "isExternal",    label: "수리 주체",  type: "enum",   required: false, enumValues: ["자체", "외부업체"],
        validation: "외부 업체가 수리했으면 '외부업체', 사내에서 했으면 '자체'(기본). 사용자가 말하지 않으면 비워둔다." },
      { name: "vendorName",    label: "외부업체명", type: "text",   required: false,
        validation: "isExternal이 '외부업체'일 때만 사용. 업체 이름을 적는다." },
      { name: "occurredAt",    label: "발생일시",     type: "date",   required: false },
    ],
    steps: [
      { api: "POST /api/internal/equipment-log",
        body: ["eventType=repair", "equipmentId", "symptom", "description", "status", "replacedParts", "isExternal", "vendorName", "occurredAt"] },
    ],
    cardTitle: "장비 수리 등록 확인",
    cardShow: ["equipmentId", "occurredAt", "symptom", "description", "status", "replacedParts", "isExternal", "vendorName"],
  },
  {
    id: "equipment_vent",
    label: "벤트 등록",
    description: "장비 벤트(진공 해제) 이력을 등록한다. 상태는 자동으로 '완료'.",
    triggers: ["벤트 등록", "벤트했어", "벤트 기록", "vent"],
    app: "equipment",
    fields: [
      { name: "equipmentId", label: "장비",      type: "id_ref", required: true, lookup: "list_equipment" },
      { name: "ventReason",  label: "벤트 사유", type: "enum",   required: false },
      { name: "description", label: "상세 내용", type: "text",   required: false },
      { name: "occurredAt",  label: "발생일시",    type: "date",   required: false },
    ],
    steps: [
      { api: "POST /api/internal/equipment-log",
        body: ["eventType=vent", "equipmentId", "ventReason", "description", "occurredAt"] },
    ],
    cardTitle: "벤트 등록 확인",
    cardShow: ["equipmentId", "occurredAt", "ventReason", "description"],
  },
  {
    id: "equipment_cleaning",
    label: "클리닝 등록",
    description: "장비 클리닝(세정) 이력을 등록한다. 상태는 자동으로 '완료'. 다음 예정일을 같이 기록할 수 있다.",
    triggers: ["클리닝 등록", "클리닝했어", "청소했어", "클리닝 기록", "cleaning"],
    app: "equipment",
    fields: [
      { name: "equipmentId",     label: "장비",        type: "id_ref", required: true, lookup: "list_equipment" },
      { name: "cleaningType",    label: "클리닝 종류", type: "enum",   required: false },
      { name: "description",     label: "상세 내용",   type: "text",   required: false },
      { name: "nextScheduledAt", label: "다음 예정일", type: "date",   required: false },
      { name: "occurredAt",      label: "발생일시",      type: "date",   required: false },
    ],
    steps: [
      { api: "POST /api/internal/equipment-log",
        body: ["eventType=cleaning", "equipmentId", "cleaningType", "description", "nextScheduledAt", "occurredAt"] },
    ],
    cardTitle: "클리닝 등록 확인",
    cardShow: ["equipmentId", "occurredAt", "cleaningType", "nextScheduledAt", "description"],
  },
];
