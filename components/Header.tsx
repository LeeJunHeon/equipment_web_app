"use client";

import { Menu, Bell } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  currentPage: "dashboard" | "equipment" | "equipment-settings" | "history-repair" | "history-vent" | "history-cleaning";
  equipmentName?: string;
  onToggleSidebar: () => void;
  unresolvedCount: number;
  unresolvedDetails?: { equipmentName: string; symptom: string }[];
  pmIssueCount?: number;
  pmIssueDetails?: { name: string; issues: string[] }[];
}

export default function Header({
  currentPage,
  equipmentName,
  onToggleSidebar,
  unresolvedCount,
  unresolvedDetails = [],
  pmIssueCount = 0,
  pmIssueDetails = [],
}: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);

  const pageTitle =
    currentPage === "dashboard"
      ? "대시보드"
      : currentPage === "equipment-settings"
      ? "장비 설정"
      : currentPage === "history-repair"
      ? "수리 이력"
      : currentPage === "history-vent"
      ? "Vent 이력"
      : currentPage === "history-cleaning"
      ? "클리닝 이력"
      : (equipmentName ?? "장비 상세");

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-5 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={18} className="text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700">{pageTitle}</span>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
        >
          <Bell size={18} className="text-gray-500" />
          {(unresolvedCount + pmIssueCount) > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
              {unresolvedCount + pmIssueCount}
            </span>
          )}
        </button>

        {showNotif && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
            <div className="absolute right-0 mt-1 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900">알림</p>
              </div>

              {unresolvedCount === 0 && pmIssueCount === 0 ? (
                <div className="px-4 py-5 text-center">
                  <p className="text-[13px] text-gray-400">새로운 알림이 없습니다</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {unresolvedCount > 0 && (
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-[11px] font-bold text-red-500 mb-2">
                        미해결 수리 {unresolvedCount}건
                      </p>
                      <div className="space-y-1.5">
                        {unresolvedDetails.map((r, i) => (
                          <p key={i} className="text-[12px] text-gray-700">
                            · {r.equipmentName}{r.symptom ? ` — ${r.symptom}` : ""}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {pmIssueCount > 0 && (
                    <div className="px-4 py-3">
                      <p className="text-[11px] font-bold text-yellow-600 mb-2">
                        정기 점검 필요 {pmIssueCount}건
                      </p>
                      <div className="space-y-1.5">
                        {pmIssueDetails.map((eq, i) => (
                          <div key={i}>
                            <p className="text-[12px] font-medium text-gray-800">· {eq.name}</p>
                            {eq.issues.map((issue, j) => (
                              <p key={j} className="text-[11px] text-gray-500 pl-3">
                                {issue}
                              </p>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
