// lib/equipmentLogMessage.ts
// 새 장비 이력을 구글챗 텍스트 메시지로 만든다.
// DB·env 에 접근하지 않는 순수 함수만 두어 발송 없이도 출력 형식을 확인할 수 있게 한다.
// 항목 라벨은 이력 등록 모달(LogRegisterModal)의 표기에 맞춘다.

import { formatKstDate, formatKstDateTime } from "@/lib/kst";
import { REPAIR_STATUS, repairStatusLabel } from "@/lib/repairStatus";

/** 메시지 생성에 필요한 이력 필드 (Prisma EquipmentLog + 장비명) */
export interface EquipmentLogMessageInput {
  equipmentName: string;
  eventType: string;
  status: string;
  occurredAt: Date;
  completedAt: Date | null;
  operator: string;
  description: string | null;
  symptom: string | null;
  replacedParts: string | null;
  isExternal: boolean;
  vendorName: string | null;
  ventReason: string | null;
  cleaningType: string | null;
  nextScheduledAt: Date | null;
}

// 긴 자유 텍스트가 채팅 한 화면을 덮지 않도록 자른다.
const MAX_TEXT_LENGTH = 500;

/** 자유 텍스트를 trim 하고 500자를 넘으면 잘라 "…" 를 붙인다. 비어 있으면 null. */
function clip(v: string | null | undefined): string | null {
  const t = (v ?? "").trim();
  if (!t) return null;
  return t.length > MAX_TEXT_LENGTH ? `${t.slice(0, MAX_TEXT_LENGTH)}…` : t;
}

/**
 * 교체 부품 원문을 사람이 읽는 문자열로 바꾼다.
 * 신규 형식은 JSON 배열 [{name, qty}], 옛 형식은 자유 텍스트라서 둘 다 받아야 한다.
 * (LogDetailModal·parts-summary 와 같은 규칙: qty 없으면 1, name 없는 항목 제외, JSON 아니면 원문)
 */
function formatReplacedParts(raw: string | null): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  try {
    const parsed: unknown = JSON.parse(t);
    if (Array.isArray(parsed)) {
      const joined = parsed
        .filter((p): p is { name: unknown; qty?: unknown } => !!p && typeof p === "object" && !!(p as { name?: unknown }).name)
        .map((p) => `${String(p.name)} x${p.qty ?? 1}개`)
        .join(", ");
      return clip(joined);
    }
  } catch {
    // JSON 이 아니면 옛 텍스트 형식 → 아래에서 원문 그대로 사용
  }
  return clip(t);
}

/** 1행(제목). 이벤트 종류별 이모지로 채팅 목록에서 한눈에 구분되게 한다. */
function buildTitle(log: EquipmentLogMessageInput): string {
  const name = `*${log.equipmentName}*`;
  switch (log.eventType) {
    case "repair":
      return `🔧 ${name} 수리 등록 · ${repairStatusLabel(log.status)}`;
    case "vent":
      return `💨 ${name} Vent 등록`;
    case "cleaning":
      return `🧹 ${name} 클리닝 등록`;
    default:
      return `📝 ${name} 이력 등록 (${log.eventType})`;
  }
}

/** 3행부터의 상세 항목. 값이 없는 항목은 [라벨, null] 로 두고 호출부에서 걸러낸다. */
function buildDetails(log: EquipmentLogMessageInput): [string, string | null][] {
  switch (log.eventType) {
    case "repair":
      return [
        ["고장 증상", clip(log.symptom)],
        ["조치 사항", clip(log.description)],
        ["교체 부품", formatReplacedParts(log.replacedParts)],
        ["외부 업체", log.isExternal ? (clip(log.vendorName) ?? "업체명 미입력") : null],
        [
          "완료 일시",
          log.status === REPAIR_STATUS.DONE && log.completedAt ? formatKstDateTime(log.completedAt) : null,
        ],
      ];
    case "vent":
      return [
        ["Vent 사유", clip(log.ventReason)],
        ["비고", clip(log.description)],
      ];
    case "cleaning":
      return [
        ["클리닝 유형", clip(log.cleaningType)],
        ["다음 예정일", log.nextScheduledAt ? formatKstDate(log.nextScheduledAt) : null],
        ["비고", clip(log.description)],
      ];
    default:
      return [];
  }
}

/**
 * 새 장비 이력 1건을 구글챗 텍스트 메시지로 만든다.
 * @param log 이력 필드 + 장비명. 일시는 KST 벽시계 규칙의 Date (lib/kst.ts 참고)
 * @returns 구글챗 텍스트 문법(*굵게*)의 여러 줄 문자열
 */
export function buildEquipmentLogMessage(log: EquipmentLogMessageInput): string {
  const lines = [
    buildTitle(log),
    `발생 ${formatKstDateTime(log.occurredAt)} · 담당 ${log.operator}`,
  ];
  for (const [label, value] of buildDetails(log)) {
    if (value) lines.push(`• ${label}: ${value}`);
  }
  return lines.join("\n");
}
