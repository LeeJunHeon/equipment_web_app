"use client";

import LogPage from "./LogPage";
import type { EquipmentLog } from "@/lib/types";

interface RepairPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
  logs: EquipmentLog[];
}

export default function RepairPage({ onDetailClick, onRegisterClick, logs }: RepairPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="repair" logs={logs} />;
}
