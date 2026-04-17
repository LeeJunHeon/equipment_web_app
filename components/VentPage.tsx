"use client";

import LogPage from "./LogPage";

interface VentPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
  refreshKey: number;
}

export default function VentPage({ onDetailClick, onRegisterClick, refreshKey }: VentPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="vent" refreshKey={refreshKey} />;
}
