"use client";

import { useState } from "react";
import {
  LayoutDashboard, ClipboardList, Wrench,
  Wind, Trash2, Monitor, X, LogOut
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import type { PageId, EquipmentLog } from "@/lib/types";

interface SidebarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
  onEquipmentClick: () => void;
  isOpen: boolean;
  onClose: () => void;
  logs: EquipmentLog[];
}

export default function Sidebar({
  currentPage,
  onNavigate,
  onEquipmentClick,
  isOpen,
  onClose,
  logs,
}: SidebarProps) {
  const { data: session } = useSession();
  const userName = session?.user?.name ?? "사용자";
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const unresolvedRepairCount = logs.filter(
    (l) => l.eventType === "repair" && l.status === "처리중"
  ).length;

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

  const handleNav = (page: PageId) => {
    onNavigate(page);
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col
          bg-white border-r border-gray-100
          transition-all duration-300 shrink-0
          ${isOpen
            ? "w-64 translate-x-0"
            : "-translate-x-full lg:translate-x-0 lg:w-0 lg:overflow-hidden lg:border-0"
          }
        `}
      >
        {/* 로고 */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wrench size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">장비 관리</h1>
                <p className="text-[10px] text-gray-400">Equipment Manager</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
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
                    onClick={() => handleNav(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? "bg-blue-50 text-blue-600 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge ? (
                      <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                        {item.badge}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ))}

          {/* 관리자 섹션 */}
          <div className="mb-2">
            <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              관리자
            </p>
            <button
              onClick={() => {
                onEquipmentClick();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 transition-all hover:bg-gray-50 hover:text-gray-900"
            >
              <Monitor size={18} className="text-gray-400" />
              <span>장비 목록</span>
            </button>
          </div>
        </nav>

        {/* 사용자 정보 + 로그아웃 */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-xs font-bold text-blue-700 shrink-0">
              {userName.charAt(0) || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-[10px] text-gray-400">관리자</p>
            </div>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              title="로그아웃"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* 로그아웃 확인 모달 */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">로그아웃</h3>
            <p className="text-sm text-gray-500">정말 로그아웃하시겠습니까?</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                취소
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "https://vanam.synology.me/login" })}
                className="px-4 py-2 text-sm font-bold text-white bg-rose-500 rounded-xl hover:bg-rose-600 transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
