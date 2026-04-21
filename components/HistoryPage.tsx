"use client";
import { useState, useEffect } from "react";
import { Wrench, Wind, Sparkles, Plus } from "lucide-react";
import type { EquipmentLog } from "@/lib/types";
import LogDetailModal from "@/components/modals/LogDetailModal";
import LogRegisterModal from "@/components/modals/LogRegisterModal";

interface HistoryPageProps {
  eventType: "repair" | "vent" | "cleaning";
  refreshKey: number;
  onRefresh: () => void;
  isAdmin?: boolean;
}

const CONFIG = {
  repair:   { label: "수리 이력",   icon: Wrench,   color: "text-red-500",   bg: "bg-red-50",   badgeCls: "bg-[#fee2e2] text-[#dc2626]" },
  vent:     { label: "Vent 이력",   icon: Wind,     color: "text-blue-500",  bg: "bg-blue-50",  badgeCls: "bg-[#dbeafe] text-[#1d4ed8]" },
  cleaning: { label: "클리닝 이력", icon: Sparkles, color: "text-green-500", bg: "bg-green-50", badgeCls: "bg-[#d1fae5] text-[#047857]" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function HistoryPage({ eventType, refreshKey, onRefresh, isAdmin = false }: HistoryPageProps) {
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const cfg = CONFIG[eventType];
  const Icon = cfg.icon;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/logs?eventType=${eventType}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setLogs(data))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [eventType, refreshKey]);

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={18} className={cfg.color} />
          <h1 className="text-[15px] font-bold text-gray-900">{cfg.label}</h1>
        </div>
        <button
          onClick={() => setShowRegister(true)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-blue-700"
        >
          <Plus size={15} /> 이력 등록
        </button>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* 테이블 헤더 */}
        <div className={`hidden sm:grid ${eventType === "repair" ? "grid-cols-[120px_100px_1fr_80px_80px]" : "grid-cols-[120px_100px_1fr_80px]"} gap-2 px-4 py-2.5 border-b border-gray-100 bg-gray-50 text-[11px] font-semibold text-gray-500`}>
          <span>날짜</span>
          <span>장비</span>
          <span>{eventType === "repair" ? "증상 / 조치" : eventType === "vent" ? "사유 / 비고" : "유형 / 비고"}</span>
          <span>담당자</span>
          {eventType === "repair" && <span>상태</span>}
        </div>

        {loading && (
          <div className="space-y-2 p-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="py-16 text-center text-[13px] text-gray-400">
            등록된 이력이 없습니다.
          </div>
        )}

        {!loading && logs.map((log) => (
          <div
            key={log.id}
            onClick={() => setSelectedLogId(log.id)}
            className={`grid ${eventType === "repair" ? "grid-cols-[120px_100px_1fr_80px_80px]" : "grid-cols-[120px_100px_1fr_80px]"} gap-2 px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer items-center text-[12px]`}
          >
            <span className="text-gray-500 text-[11px]">{formatDate(log.occurredAt)}</span>
            <span className="font-medium text-gray-900 truncate">{log.equipmentName}</span>
            <span className="text-gray-500 truncate">
              {eventType === "repair"
                ? [log.symptom, log.description].filter(Boolean).join(" / ") || "—"
                : eventType === "vent"
                ? [log.ventReason, log.description].filter(Boolean).join(" / ") || "—"
                : [log.cleaningType, log.description].filter(Boolean).join(" / ") || "—"}
            </span>
            <span className="text-gray-500">{log.operator}</span>
            {eventType === "repair" && (
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium w-fit ${log.status === "처리중" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                {log.status}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* 모바일용 카드 목록 — sm 이하에서만 표시 */}
      {!loading && logs.length > 0 && (
        <div className="sm:hidden space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedLogId(log.id)}
              className="bg-white rounded-xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[13px] text-gray-900">{log.equipmentName}</span>
                {eventType === "repair" && (
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${log.status === "처리중" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                    {log.status}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate mb-1">
                {eventType === "repair"
                  ? [log.symptom, log.description].filter(Boolean).join(" / ") || "—"
                  : eventType === "vent"
                  ? [log.ventReason, log.description].filter(Boolean).join(" / ") || "—"
                  : [log.cleaningType, log.description].filter(Boolean).join(" / ") || "—"}
              </p>
              <p className="text-[10px] text-gray-400">{formatDate(log.occurredAt)} · {log.operator}</p>
            </div>
          ))}
        </div>
      )}

      <LogDetailModal
        isOpen={selectedLogId !== null}
        onClose={() => setSelectedLogId(null)}
        onSave={() => { setSelectedLogId(null); onRefresh(); }}
        logId={selectedLogId}
        logs={logs}
        isAdmin={isAdmin}
      />

      <LogRegisterModal
        isOpen={showRegister}
        onClose={() => setShowRegister(false)}
        onSave={() => { setShowRegister(false); onRefresh(); }}
        defaultEventType={eventType}
      />
    </div>
  );
}
