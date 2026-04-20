"use client";

import { Menu, Plus } from "lucide-react";
import type { PageId } from "@/lib/types";

interface HeaderProps {
  currentPage: PageId;
  onToggleSidebar: () => void;
  onRegisterClick: () => void;
}

const PAGE_TITLES: Record<PageId, string> = {
  dashboard: "대시보드",
  log: "전체 이력",
  repair: "수리 이력",
  vent: "Vent 이력",
  cleaning: "클리닝 이력",
};

export default function Header({ currentPage, onToggleSidebar, onRegisterClick }: HeaderProps) {
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
      <button
        onClick={onRegisterClick}
        className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium px-3 py-2 rounded-lg transition-colors"
      >
        <Plus size={14} />
        이력 등록
      </button>
    </header>
  );
}
