export type PageId = "dashboard" | "equipment";

export type EventType = "repair" | "vent" | "cleaning";
export type StatusType = "처리중" | "완료";

export interface Equipment {
  id: number;
  name: string;
  category: string | null;
  isVentTarget: boolean;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  unresolvedRepairCount: number;
}

export interface PhotoInfo {
  id: number;
  fileName: string;
  fileSize: number | null;
}

export interface EquipmentLog {
  id: number;
  equipmentId: number;
  equipmentName: string;
  eventType: EventType;
  occurredAt: string;
  operator: string;
  description: string | null;
  photos: PhotoInfo[];
  status: StatusType;
  symptom?: string | null;
  replacedParts?: string | null;
  isExternal?: boolean;
  vendorName?: string | null;
  ventReason?: string | null;
  finalPressure?: string | null;
  pumpedDownAt?: string | null;
  cleaningType?: string | null;
  nextScheduledAt?: string | null;
}

export interface EntryPhoto {
  id: number;
  fileName: string;
  fileSize: number | null;
}

export interface LogEntry {
  id: number;
  logId: number;
  memo: string | null;
  occurredAt: string;
  createdAt: string;
  photos: EntryPhoto[];
}
