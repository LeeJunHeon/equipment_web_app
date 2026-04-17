"use client";

import LogPage from "./LogPage";

interface CleaningPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
}

export default function CleaningPage({ onDetailClick, onRegisterClick }: CleaningPageProps) {
  return <LogPage onDetailClick={onDetailClick} onRegisterClick={onRegisterClick} filterType="cleaning" />;
}
