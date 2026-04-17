"use client";

import LogPage from "./LogPage";

interface RepairPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
  refreshKey: number;
}

export default function RepairPage({ onDetailClick, onRegisterClick, refreshKey }: RepairPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="repair" refreshKey={refreshKey} />;
}
