"use client";

import LogPage from "./LogPage";

interface VentPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
}

export default function VentPage({ onDetailClick, onRegisterClick }: VentPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="vent" />;
}
