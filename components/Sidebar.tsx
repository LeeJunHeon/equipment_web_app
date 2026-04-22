"use client";

import { useState, useEffect } from "react";
import { Home, Wrench, X, LogOut, Settings, ChevronDown, ChevronRight, FileText, Wind, Sparkles } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import type { Equipment } from "@/lib/types";

interface SidebarProps {
  currentPage: "dashboard" | "equipment" | "equipment-settings" | "history-repair" | "history-vent" | "history-cleaning";
  selectedEquipmentId: number | null;
  onNavigateDashboard: () => void;
  onNavigateEquipment: (equipment: Equipment) => void;
  onEquipmentSettingClick: () => void;
  onNavigateHistory: (type: "repair" | "vent" | "cleaning") => void;
  isAdmin: boolean;
  isDesktop?: boolean;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({
  currentPage,
  selectedEquipmentId,
  onNavigateDashboard,
  onNavigateEquipment,
  onEquipmentSettingClick,
  onNavigateHistory,
  isAdmin,
  isDesktop = false,
  isOpen,
  onClose,
}: SidebarProps) {
  const { data: session } = useSession();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [equipmentsLoaded, setEquipmentsLoaded] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setHistoryOpen(true);
      setEquipmentOpen(true);
    }
  }, [isDesktop]);

  const userName = session?.user?.name ?? "사용자";
  const initial = (() => {
    if (!userName || userName === "사용자") return "?";
    const parts = userName.trim().split(" ").filter((p) => p.length > 0);
    const target = parts.length > 1 ? parts[parts.length - 1] : parts[0];
    return target.charAt(0).toUpperCase();
  })();

  useEffect(() => {
    fetch("/api/equipment")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        setEquipments(data);
        setEquipmentsLoaded(true);
      })
      .catch(() => {
        setEquipments([]);
        setEquipmentsLoaded(true);
      });
  }, []);

  const totalUnresolved = equipments.reduce(
    (sum, eq) => sum + eq.unresolvedRepairCount,
    0
  );

  const handleNav = (fn: () => void) => {
    fn();
    if (window.innerWidth < 1024) onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
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
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <Wrench size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-gray-900">장비 관리</h1>
                <p className="text-[10px] text-gray-400">Equipment Manager</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 lg:hidden">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
          {/* 대시보드 */}
          <button
            onClick={() => handleNav(onNavigateDashboard)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
              currentPage === "dashboard"
                ? "bg-blue-50 text-blue-600 font-semibold"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <Home size={18} />
            <span className="flex-1 text-left">대시보드</span>
            {totalUnresolved > 0 && currentPage !== "dashboard" && (
              <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {totalUnresolved}
              </span>
            )}
          </button>

          {/* 이력 조회 아코디언 */}
          <div className="mt-1">
            <button
              onClick={() => setHistoryOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <FileText size={18} className="text-gray-400" />
              <span className="flex-1 text-left">이력 조회</span>
              {historyOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
            </button>
            {historyOpen && (
              <div className="ml-4 pl-3 border-l border-gray-100 space-y-0.5 mt-0.5">
                <button
                  onClick={() => handleNav(() => onNavigateHistory("repair"))}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all ${
                    currentPage === "history-repair"
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Wrench size={14} className="text-red-400" />
                  수리 이력
                </button>
                <button
                  onClick={() => handleNav(() => onNavigateHistory("vent"))}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all ${
                    currentPage === "history-vent"
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Wind size={14} className="text-blue-400" />
                  Vent 이력
                </button>
                <button
                  onClick={() => handleNav(() => onNavigateHistory("cleaning"))}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all ${
                    currentPage === "history-cleaning"
                      ? "bg-blue-50 text-blue-600 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Sparkles size={14} className="text-green-400" />
                  클리닝 이력
                </button>
              </div>
            )}
          </div>

          {/* 장비 아코디언 */}
          <div className="mt-1">
            <button
              onClick={() => setEquipmentOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all"
            >
              <Wrench size={18} className="text-gray-400" />
              <span className="flex-1 text-left">장비</span>
              <div className="flex items-center gap-1.5">
                {totalUnresolved > 0 && !equipmentOpen && (
                  <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                    {totalUnresolved}
                  </span>
                )}
                {equipmentOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
              </div>
            </button>
            {equipmentOpen && (
              <div className="ml-4 pl-3 border-l border-gray-100 space-y-0.5 mt-0.5">
                {!equipmentsLoaded && (
                  <div className="space-y-1 px-1">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-8 bg-gray-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                )}
                {equipmentsLoaded && equipments.length === 0 && (
                  <div className="px-3 py-2 text-[11px] text-gray-400">등록된 장비가 없습니다.</div>
                )}
                {equipments.map((eq) => {
                  const isActive = currentPage === "equipment" && selectedEquipmentId === eq.id;
                  return (
                    <button
                      key={eq.id}
                      onClick={() => handleNav(() => onNavigateEquipment(eq))}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all ${
                        isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex-1 text-left truncate">{eq.name}</span>
                      {eq.unresolvedRepairCount > 0 && (
                        <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                          {eq.unresolvedRepairCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 장비 설정 */}
          {isAdmin && (
            <div className="mt-1">
              <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                관리자
              </div>
              <button
                onClick={() => handleNav(onEquipmentSettingClick)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                  currentPage === "equipment-settings"
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Settings size={18} className={currentPage === "equipment-settings" ? "text-blue-500" : "text-gray-400"} />
                <span>장비 설정</span>
              </button>
            </div>
          )}
        </nav>

        {/* 사용자 정보 */}
        <div className="px-3 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{userName}</p>
              <p className="text-[10px] text-gray-400">{isAdmin ? "관리자" : "직원"}</p>
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
