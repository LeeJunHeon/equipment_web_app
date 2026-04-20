"use client";

import { useState, useEffect } from "react";
import { Package, AlertTriangle, Wind, Sparkles } from "lucide-react";
import type { Equipment, EquipmentLog } from "@/lib/types";

interface DashboardPageProps {
  onNavigateEquipment: (equipment: Equipment) => void;
  onDetailClick: (logId: number) => void;
  refreshKey: number;
}

export default function DashboardPage({ onNavigateEquipment, onDetailClick, refreshKey }: DashboardPageProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [eqRes, logRes] = await Promise.all([
          fetch("/api/equipment"),
          fetch("/api/logs"),
        ]);
        if (eqRes.ok) setEquipments(await eqRes.json());
        if (logRes.ok) setLogs(await logRes.json());
      } catch (error) {
        console.error("Dashboard fetch error:", error);
        setEquipments([]);
        setLogs([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [refreshKey]);

  const unresolvedRepairs = logs.filter((l) => l.eventType === "repair" && l.status === "처리중");

  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const ventCount = logs.filter((l) => l.eventType === "vent" && l.occurredAt.startsWith(thisMonth)).length;
  const cleaningCount = logs.filter((l) => l.eventType === "cleaning" && l.occurredAt.startsWith(thisMonth)).length;

  const stats = [
    { label: "전체 장비", value: equipments.length, iconBg: "bg-blue-100", icon: <Package size={18} className="text-blue-600" /> },
    { label: "미해결 수리", value: unresolvedRepairs.length, iconBg: "bg-red-100", icon: <AlertTriangle size={18} className="text-red-600" /> },
    { label: "이번 달 Vent", value: ventCount, iconBg: "bg-yellow-100", icon: <Wind size={18} className="text-yellow-600" /> },
    { label: "이번 달 클리닝", value: cleaningCount, iconBg: "bg-green-100", icon: <Sparkles size={18} className="text-green-600" /> },
  ];

  function getEquipmentStatus(eqId: number) {
    const hasUnresolved = logs.some((l) => l.equipmentId === eqId && l.eventType === "repair" && l.status === "처리중");
    if (hasUnresolved) return { label: "수리미완료", cls: "bg-red-100 text-red-700" };
    return { label: "정상운영", cls: "bg-green-100 text-green-700" };
  }

  function getLastDate(eqId: number, type: string) {
    const log = logs.filter((l) => l.equipmentId === eqId && l.eventType === type).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
    return log ? log.occurredAt.split("T")[0] : "-";
  }

  function daysSince(dateStr: string) {
    const d = new Date(dateStr);
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  if (loading) {
    return (
      <div className="space-y-5">
        <p className="text-[13px] text-gray-400">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            onClick={s.onClick}
            className={`flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm ${s.onClick ? "cursor-pointer hover:shadow-md" : ""}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.iconBg}`}>{s.icon}</div>
            <div>
              <p className="text-[11px] text-gray-500">{s.label}</p>
              <p className="text-[20px] font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-3 text-[14px] font-bold text-gray-900">장비 현황</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {equipments.map((eq) => {
            const status = getEquipmentStatus(eq.id);
            const hasUnresolved = status.label === "수리미완료";
            return (
              <div
                key={eq.id}
                className={`rounded-xl border bg-white p-4 shadow-sm ${hasUnresolved ? "border-l-2 border-l-red-400 border-t-gray-100 border-r-gray-100 border-b-gray-100" : "border-gray-100"}`}
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">{eq.name}</p>
                    <p className="text-[11px] text-gray-400">{eq.category}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${status.cls}`}>{status.label}</span>
                </div>
                <div className="space-y-1 text-[11px] text-gray-500">
                  <p>마지막 수리: {getLastDate(eq.id, "repair")}</p>
                  {eq.isVentTarget && <p>마지막 Vent: {getLastDate(eq.id, "vent")}</p>}
                  <p>마지막 클리닝: {getLastDate(eq.id, "cleaning")}</p>
                </div>
                <button
                  onClick={() => onNavigateEquipment(eq)}
                  className="mt-2 text-[11px] font-medium text-blue-600 hover:text-blue-800"
                >
                  이력 보기 →
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-[14px] font-bold text-gray-900">미해결 수리</h2>
        <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full text-left text-[12px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="px-4 py-2.5 font-semibold text-gray-500">장비</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500">증상</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500">담당자</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500">발생일</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500">경과일</th>
                <th className="px-4 py-2.5 font-semibold text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {unresolvedRepairs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">미해결 수리 건이 없습니다.</td></tr>
              )}
              {unresolvedRepairs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{log.equipmentName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{log.symptom || "-"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{log.operator}</td>
                  <td className="px-4 py-2.5 text-gray-600">{log.occurredAt.split("T")[0]}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                      {daysSince(log.occurredAt)}일
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => onDetailClick(log.id)}
                      className="rounded-md bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-100"
                    >
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
