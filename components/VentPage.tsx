"use client";

import LogPage from "./LogPage";
import type { EquipmentLog } from "@/lib/types";

interface VentPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
  logs: EquipmentLog[];
}

export default function VentPage({ onDetailClick, onRegisterClick, logs }: VentPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="vent" logs={logs} />;
}
