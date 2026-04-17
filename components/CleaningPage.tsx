"use client";

import LogPage from "./LogPage";
import type { EquipmentLog } from "@/lib/types";

interface CleaningPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
  logs: EquipmentLog[];
}

export default function CleaningPage({ onDetailClick, onRegisterClick, logs }: CleaningPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="cleaning" logs={logs} />;
}
