"use client";

import { LayoutDashboard, ClipboardList, Wrench, Wind, Trash2, Monitor, X, Menu } from "lucide-react";
import type { PageId } from "@/lib/types";

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onEquipmentClick: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

const unresolvedRepairCount = 3;

const navSections = [
  {
    label: "메인",
    items: [
      { id: "dashboard" as PageId, label: "대시보드", icon: LayoutDashboard },
      { id: "log" as PageId, label: "전체 이력", icon: ClipboardList, badge: unresolvedRepairCount },
    ],
  },
  {
    label: "이력",
    items: [
      { id: "repair" as PageId, label: "수리", icon: Wrench, badge: unresolvedRepairCount },
      { id: "vent" as PageId, label: "Vent", icon: Wind },
      { id: "cleaning" as PageId, label: "클리닝", icon: Trash2 },
    ],
  },
];

export default function Sidebar({ currentPage, onNavigate, onEquipmentClick, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      <button
        className="fixed top-3 left-3 z-50 rounded-lg border border-gray-200 bg-white p-2 shadow-sm md:hidden"
        onClick={onToggle}
      >
        <Menu size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/30 md:hidden" onClick={onToggle} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[196px] flex-col border-r border-gray-200 bg-white transition-transform md:static md:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Wrench size={16} className="text-white" />
          </div>
          <span className="text-[14px] font-bold text-gray-900">장비 관리</span>
          <button className="ml-auto md:hidden" onClick={onToggle}>
            <X size={16} className="text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-1">
          {navSections.map((section) => (
            <div key={section.label} className="mb-2">
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                {section.label}
              </p>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onNavigate(item.id);
                      onToggle();
                    }}
                    className={`flex w-full items-center gap-2 rounded-lg px-3 py-[7px] text-[12.5px] transition-colors ${
                      active
                        ? "bg-blue-50 font-semibold text-blue-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={15} className={active ? "text-blue-600" : "text-gray-400"} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}

          <div className="mb-2">
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              관리자
            </p>
            <button
              onClick={() => {
                onEquipmentClick();
                onToggle();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-[7px] text-[12.5px] text-gray-600 transition-colors hover:bg-gray-50"
            >
              <Monitor size={15} className="text-gray-400" />
              <span>장비 목록</span>
            </button>
          </div>
        </nav>

        <div className="border-t border-gray-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
              이
            </div>
            <div className="flex flex-col">
              <span className="text-[12px] font-medium text-gray-800">이준헌</span>
              <span className="text-[10px] text-gray-400">관리자</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
