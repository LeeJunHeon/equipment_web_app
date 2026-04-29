"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, Wind, Sparkles, ShieldAlert, Activity } from "lucide-react";
import type { Equipment } from "@/lib/types";
import { getPmStatusLabel, getPmStatusColor, PM_CONFIG } from "@/lib/pmConfig";

interface EquipmentDashboard {
  id: number;
  name: string;
  category: string | null;
  isVentTarget: boolean;
  unresolvedRepairCount: number;
  unresolvedRepairs: { id: number; symptom: string | null; operator: string; occurredAt: string }[];
  lastVentDate?: string;
  lastCleaningDate?: string;
  ventStatus: "normal" | "caution" | "overdue";
  cleaningStatus: "normal" | "caution" | "overdue";
  uptimePercent: number;
  downtimeHours: number;
  ventIntervalDays: number;
  cleaningIntervalDays: number;
  isCleaningTarget?: boolean;
}

interface DashboardData {
  equipments: EquipmentDashboard[];
  totalUnresolved: number;
  pmIssueCount: number;
}

interface DashboardPageProps {
  onNavigateEquipment: (equipment: Equipment) => void;
  onDetailClick: (logId: number) => void;
  onRegisterLog: (type: "repair" | "vent" | "cleaning", equipment: Equipment) => void;
  refreshKey: number;
}

export default function DashboardPage({
  onNavigateEquipment,
  onDetailClick,
  onRegisterLog,
  refreshKey,
}: DashboardPageProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch("/api/dashboard")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-gray-400">
        데이터를 불러오지 못했습니다.
      </div>
    );
  }

  const { equipments, totalUnresolved, pmIssueCount } = data;
  const pmIssueEquipments = equipments.filter(
    (e) => e.ventStatus !== "normal" || e.cleaningStatus !== "normal"
  );
  const unresolvedRepairs = equipments.flatMap((e) =>
    e.unresolvedRepairs.map((r) => ({ ...r, equipmentName: e.name }))
  );

  // 미해결 수리 장비 이름 목록
  const unresolvedEquipNames = equipments
    .filter((e) => e.unresolvedRepairCount > 0)
    .map((e) => e.name)
    .join(" · ");

  // PM 이슈 분류 (Vent / 클리닝 건수)
  const ventIssueCount = equipments.filter(
    (e) => e.isVentTarget && e.ventStatus !== "normal"
  ).length;
  const cleaningIssueCount = equipments.filter(
    (e) => e.isCleaningTarget !== false && e.cleaningStatus !== "normal"
  ).length;
  const pmSubParts: string[] = [];
  if (ventIssueCount > 0) pmSubParts.push(`Vent ${ventIssueCount}건`);
  if (cleaningIssueCount > 0) pmSubParts.push(`클리닝 ${cleaningIssueCount}건`);
  const pmSub = pmSubParts.join(" · ");

  const stats = [
    {
      label: "전체 장비",
      value: equipments.length,
      sub: "활성 장비",
      iconBg: "bg-blue-100",
      icon: <Package size={18} className="text-blue-600" />,
    },
    {
      label: "미해결 수리",
      value: totalUnresolved,
      sub: unresolvedEquipNames || "없음",
      iconBg: "bg-red-100",
      icon: <AlertTriangle size={18} className="text-red-600" />,
    },
    {
      label: "정기 점검 필요",
      value: pmIssueCount,
      sub: pmSub || "없음",
      iconBg: "bg-yellow-100",
      icon: <ShieldAlert size={18} className="text-yellow-600" />,
    },
    {
      label: "평균 가동률",
      value:
        equipments.length > 0
          ? `${Math.round(
              equipments.reduce((s, e) => s + e.uptimePercent, 0) /
                equipments.length
            )}%`
          : "–",
      sub: (() => {
        const totalDowntime = equipments.reduce((s, e) => s + e.downtimeHours, 0);
        return totalDowntime > 0 ? `비가동 합계 ${totalDowntime}h` : "이번 달 기준";
      })(),
      iconBg: "bg-green-100",
      icon: <Activity size={18} className="text-green-600" />,
    },
  ];

  function daysSince(dateStr: string) {
    const d = new Date(dateStr);
    const now = new Date();
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-5">
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}>
              {s.icon}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className="text-[20px] font-bold leading-tight">{s.value}</p>
              <p className="text-[11px] text-gray-400 truncate">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* PM 주의 장비 섹션 */}
      {pmIssueEquipments.length > 0 && (
        <div>
          <h2 className="mb-3 text-[14px] font-bold text-gray-900 flex items-center gap-2">
            <ShieldAlert size={15} className="text-yellow-500" />
            정기 점검 필요
          </h2>
          <div className="space-y-2">
            {pmIssueEquipments.map((eq) => {
              const ventColor = getPmStatusColor(eq.ventStatus);
              const cleaningColor = getPmStatusColor(eq.cleaningStatus);
              return (
                <div
                  key={eq.id}
                  className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => onNavigateEquipment(eq as unknown as Equipment)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-gray-900 truncate">{eq.name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {eq.isVentTarget && eq.ventStatus !== "normal" && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${ventColor.bg} ${ventColor.text}`}>
                          Vent {getPmStatusLabel(eq.ventStatus)}
                          {eq.lastVentDate && ` · ${daysSince(eq.lastVentDate)}일 경과`}
                          {!eq.lastVentDate && " · 기록 없음"}
                        </span>
                      )}
                      {eq.cleaningStatus !== "normal" && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${cleaningColor.bg} ${cleaningColor.text}`}>
                          클리닝 {getPmStatusLabel(eq.cleaningStatus)}
                          {eq.lastCleaningDate && ` · ${daysSince(eq.lastCleaningDate)}일 경과`}
                          {!eq.lastCleaningDate && " · 기록 없음"}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-blue-500 ml-3 shrink-0">이동 →</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 장비 현황 */}
      <div>
        <h2 className="mb-3 text-[14px] font-bold text-gray-900">장비 현황</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {equipments.map((eq) => {
            const ventColor = getPmStatusColor(eq.ventStatus);
            const cleaningColor = getPmStatusColor(eq.cleaningStatus);
            const hasIssue = eq.unresolvedRepairCount > 0;
            return (
              <div
                key={eq.id}
                className={`rounded-xl border bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex flex-col ${
                  hasIssue
                    ? "border-l-4 border-l-red-400 border-t-gray-100 border-r-gray-100 border-b-gray-100"
                    : "border-gray-100"
                }`}
                onClick={() => onNavigateEquipment(eq as unknown as Equipment)}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{eq.name}</p>
                    <p className="text-[11px] text-gray-400">{eq.category}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {hasIssue ? (
                      <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-medium">
                        수리 중
                      </span>
                    ) : (
                      <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[10px] font-medium">
                        정상
                      </span>
                    )}
                  </div>
                </div>

                {/* PM 상태 */}
                <div className="space-y-1 mb-2 min-h-[48px]">
                  {eq.isVentTarget && (
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Wind size={11} />
                        <span>
                          {`Vent · ${eq.lastVentDate ? `${daysSince(eq.lastVentDate)}일 전` : "기록 없음"} (${eq.ventIntervalDays === 0 ? "주기 없음" : `${eq.ventIntervalDays}일 주기`})`}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${ventColor.bg} ${ventColor.text}`}>
                        {getPmStatusLabel(eq.ventStatus)}
                      </span>
                    </div>
                  )}
                  {eq.isCleaningTarget !== false && (
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Sparkles size={11} />
                        <span>
                          {`클리닝 · ${eq.lastCleaningDate ? `${daysSince(eq.lastCleaningDate)}일 전` : "기록 없음"} (${eq.cleaningIntervalDays === 0 ? "주기 없음" : `${eq.cleaningIntervalDays}일 주기`})`}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${cleaningColor.bg} ${cleaningColor.text}`}>
                        {getPmStatusLabel(eq.cleaningStatus)}
                      </span>
                    </div>
                  )}
                </div>

                {/* 가동률 */}
                <div>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-gray-500">이번 달 가동률</span>
                    <span className={`font-bold ${eq.uptimePercent >= 90 ? "text-green-600" : eq.uptimePercent >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                      {eq.uptimePercent}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        eq.uptimePercent >= 90
                          ? "bg-green-500"
                          : eq.uptimePercent >= 70
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${eq.uptimePercent}%` }}
                    />
                  </div>
                  {eq.downtimeHours > 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      비가동 {eq.downtimeHours}h
                    </p>
                  )}
                </div>

                {/* 빠른 이력 등록 */}
                <div className="flex gap-1.5 border-t border-gray-50 pt-2 mt-auto">
                  <button
                    className="flex-1 rounded-lg border border-gray-200 py-2.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={(e) => { e.stopPropagation(); onRegisterLog("repair", eq as unknown as Equipment); }}
                  >
                    수리 등록
                  </button>
                  {eq.isVentTarget && (
                    <button
                      className="flex-1 rounded-lg border border-gray-200 py-2.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onRegisterLog("vent", eq as unknown as Equipment); }}
                    >
                      Vent
                    </button>
                  )}
                  {eq.isCleaningTarget !== false && (
                    <button
                      className="flex-1 rounded-lg border border-gray-200 py-2.5 text-[11px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                      onClick={(e) => { e.stopPropagation(); onRegisterLog("cleaning", eq as unknown as Equipment); }}
                    >
                      클리닝
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 미해결 수리 목록 */}
      {unresolvedRepairs.length > 0 && (
        <div>
          <h2 className="mb-3 text-[14px] font-bold text-gray-900">미해결 수리</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-2.5 font-semibold text-gray-500">장비</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500">증상</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 font-semibold text-gray-500">담당자</th>
                  <th className="hidden sm:table-cell px-4 py-2.5 font-semibold text-gray-500">발생일</th>
                  <th className="px-4 py-2.5 font-semibold text-gray-500">경과일</th>
                </tr>
              </thead>
              <tbody>
                {unresolvedRepairs.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{r.equipmentName}</td>
                    <td className="px-4 py-2.5 text-gray-600">{r.symptom ?? "–"}</td>
                    <td className="hidden sm:table-cell px-4 py-2.5 text-gray-600">{r.operator}</td>
                    <td className="hidden sm:table-cell px-4 py-2.5 text-gray-600">{r.occurredAt.split("T")[0]}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                        {daysSince(r.occurredAt)}일
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
