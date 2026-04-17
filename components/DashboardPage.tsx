"use client";

import { Package, AlertTriangle, Wind, Sparkles } from "lucide-react";
import { EQUIPMENTS, LOGS } from "@/lib/mockData";
import type { PageId } from "@/lib/types";

interface DashboardPageProps {
  onNavigate: (page: PageId) => void;
  onRegisterClick: () => void;
  onDetailClick: (logId: number) => void;
}

export default function DashboardPage({ onNavigate, onRegisterClick, onDetailClick }: DashboardPageProps) {
  const unresolvedRepairs = LOGS.filter((l) => l.eventType === "repair" && l.status === "처리중");
  const ventCount = LOGS.filter((l) => l.eventType === "vent").length;
  const cleaningCount = LOGS.filter((l) => l.eventType === "cleaning").length;

  const stats = [
    { label: "전체 장비", value: EQUIPMENTS.length, color: "bg-blue-50 text-blue-700", iconBg: "bg-blue-100", icon: <Package size={18} className="text-blue-600" /> },
    { label: "미해결 수리", value: unresolvedRepairs.length, color: "bg-red-50 text-red-700", iconBg: "bg-red-100", icon: <AlertTriangle size={18} className="text-red-600" />, onClick: () => onNavigate("repair") },
    { label: "이번 달 Vent", value: ventCount, color: "bg-yellow-50 text-yellow-700", iconBg: "bg-yellow-100", icon: <Wind size={18} className="text-yellow-600" /> },
    { label: "이번 달 클리닝", value: cleaningCount, color: "bg-green-50 text-green-700", iconBg: "bg-green-100", icon: <Sparkles size={18} className="text-green-600" /> },
  ];

  function getEquipmentStatus(eqId: number) {
    const hasUnresolved = LOGS.some((l) => l.equipmentId === eqId && l.eventType === "repair" && l.status === "처리중");
    if (hasUnresolved) return { label: "수리미완료", cls: "bg-red-100 text-red-700" };
    return { label: "정상운영", cls: "bg-green-100 text-green-700" };
  }

  function getLastDate(eqId: number, type: string) {
    const log = LOGS.filter((l) => l.equipmentId === eqId && l.eventType === type).sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
    return log ? log.occurredAt.split(" ")[0] : "-";
  }

  function daysSince(dateStr: string) {
    const d = new Date(dateStr.replace(" ", "T"));
    const now = new Date("2026-04-17");
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-gray-900">대시보드</h1>
        <button
          onClick={onRegisterClick}
          className="rounded-lg bg-blue-600 px-3.5 py-2 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          + 이력 등록
        </button>
      </div>

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
          {EQUIPMENTS.map((eq) => {
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
                  onClick={() => onNavigate("log")}
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
              {unresolvedRepairs.map((log) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-900">{log.equipmentName}</td>
                  <td className="px-4 py-2.5 text-gray-600">{log.symptom || "-"}</td>
                  <td className="px-4 py-2.5 text-gray-600">{log.operator}</td>
                  <td className="px-4 py-2.5 text-gray-600">{log.occurredAt.split(" ")[0]}</td>
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
