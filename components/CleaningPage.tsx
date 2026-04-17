"use client";

import LogPage from "./LogPage";

interface CleaningPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
  refreshKey: number;
}

export default function CleaningPage({ onDetailClick, onRegisterClick, refreshKey }: CleaningPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="cleaning" refreshKey={refreshKey} />;
}
