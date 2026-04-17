"use client";

import LogPage from "./LogPage";

interface RepairPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
}

export default function RepairPage({ onDetailClick, onRegisterClick }: RepairPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="repair" />;
}
