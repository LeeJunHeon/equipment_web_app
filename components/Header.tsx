"use client";

import { Menu, Bell } from "lucide-react";
import { useState } from "react";
import type { PageId } from "@/lib/types";

interface HeaderProps {
  currentPage: PageId;
  onToggleSidebar: () => void;
  unresolvedCount: number;
}

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "대시보드",
  log: "전체 이력",
  repair: "수리 이력",
  vent: "Vent 이력",
  cleaning: "클리닝 이력",
};

export default function Header({ currentPage, onToggleSidebar, unresolvedCount }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-5 shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu size={18} className="text-gray-500" />
        </button>
        <span className="text-sm font-semibold text-gray-700">
          {PAGE_TITLES[currentPage]}
        </span>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
        >
          <Bell size={18} className="text-gray-500" />
          {unresolvedCount > 0 && (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
              {unresolvedCount}
            </span>
          )}
        </button>

        {showNotif && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
            <div className="absolute right-0 mt-1 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-20">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900">알림</p>
                {unresolvedCount > 0 && (
                  <span className="text-xs font-semibold text-rose-500">
                    미해결 수리 {unresolvedCount}건
                  </span>
                )}
              </div>
              {unresolvedCount > 0 ? (
                <div className="px-4 py-3">
                  <p className="text-sm text-gray-700">
                    미완료 수리 이력이 <span className="font-bold text-rose-500">{unresolvedCount}건</span> 있습니다.
                  </p>
                  <p className="text-xs text-gray-400 mt-1">수리 이력 탭에서 확인하세요.</p>
                </div>
              ) : (
                <div className="px-4 py-4">
                  <p className="text-sm text-gray-400 text-center">새로운 알림이 없습니다</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
