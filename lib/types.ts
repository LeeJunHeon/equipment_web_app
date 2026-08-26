import type { RepairStatus } from "@/lib/repairStatus";

export type PageId = "dashboard" | "equipment" | "equipment-settings" | "history-repair" | "history-vent" | "history-cleaning";

export type EventType = "repair" | "vent" | "cleaning";
export type StatusType = RepairStatus;   // "가동중" | "정지중" | "완료"

export interface Equipment {
  id: number;
  name: string;
  category: string | null;
  isVentTarget: boolean;
  isCleaningTarget?: boolean;
  description?: string | null;
  isActive?: boolean;
  createdAt?: string;
  unresolvedRepairCount: number;
  inProgressRepairCount?: number;
  needsRepairCount?: number;
  ventIntervalDays?: number;
  cleaningIntervalDays?: number;
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
  cleaningType?: string | null;
  nextScheduledAt?: string | null;
  completedAt?: string | null;
  downtimes?: DowntimeInterval[];
}

export interface DowntimeInterval {
  id: number;
  startedAt: string;
  endedAt: string | null;
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
