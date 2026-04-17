export type PageId = "dashboard" | "log" | "repair" | "vent" | "cleaning";
export type EventType = "repair" | "vent" | "cleaning";
export type StatusType = "처리중" | "완료";

export interface Equipment {
  id: number;
  name: string;
  category: string;
  isVentTarget: boolean;
}

export interface EquipmentLog {
  id: number;
  equipmentId: number;
  equipmentName: string;
  eventType: EventType;
  occurredAt: string;
  operator: string;
  description: string;
  photoCount: number;
  status: StatusType;
  symptom?: string;
  replacedParts?: string;
  isExternal?: boolean;
  vendorName?: string;
  ventReason?: string;
  finalPressure?: string;
  pumpedDownAt?: string;
  cleaningType?: string;
  nextScheduledAt?: string;
}
