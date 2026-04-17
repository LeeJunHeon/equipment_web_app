"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Camera } from "lucide-react";
import type { EventType, Equipment, EquipmentLog } from "@/lib/types";

interface LogPageProps {
  onDetailClick: (logId: number) => void;
  onRegisterClick: () => void;
  filterType?: EventType | null;
  refreshKey: number;
}

const eventBadge: Record<EventType, { label: string; cls: string }> = {
  repair: { label: "수리", cls: "bg-[#fee2e2] text-[#dc2626]" },
  vent: { label: "Vent", cls: "bg-[#dbeafe] text-[#1d4ed8]" },
  cleaning: { label: "클리닝", cls: "bg-[#d1fae5] text-[#047857]" },
};

const pageTitle: Record<string, string> = {
  repair: "수리 이력",
  vent: "Vent 이력",
  cleaning: "클리닝 이력",
};

function formatDate(dateStr: string) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function LogPage({ onDetailClick, onRegisterClick, filterType, refreshKey }: LogPageProps) {
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [search, setSearch] = useState("");
  const [equipFilter, setEquipFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType) params.set("eventType", filterType);
      if (equipFilter) params.set("equipmentId", equipFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/logs?${params.toString()}`);
      if (res.ok) setLogs(await res.json());
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filterType, equipFilter, statusFilter, refreshKey]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    async function fetchEquipments() {
      try {
        const res = await fetch("/api/equipment");
        if (res.ok) setEquipments(await res.json());
      } catch (error) {
        console.error("Failed to fetch equipments:", error);
        setEquipments([]);
      }
    }
    fetchEquipments();
  }, []);

  const filtered = search
    ? logs.filter((log) => {
        const q = search.toLowerCase();
        return (
          log.equipmentName.toLowerCase().includes(q) ||
          log.operator.toLowerCase().includes(q) ||
          (log.description || "").toLowerCase().includes(q)
        );
      })
    : logs;

  const title = filterType ? pageTitle[filterType] : "전체 이력";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] font-bold text-gray-900">{title}</h1>
        <button
          onClick={onRegisterClick}
          className="rounded-lg bg-blue-600 px-3.5 py-2 text-[12px] font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          + 이력 등록
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="장비명, 담당자, 내용 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-[12px] outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <select
          value={equipFilter}
          onChange={(e) => setEquipFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
        >
          <option value="">전체 장비</option>
          {equipments.map((eq) => (
            <option key={eq.id} value={eq.id}>{eq.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
        >
          <option value="">전체 상태</option>
          <option value="처리중">처리중</option>
          <option value="완료">완료</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-[12px]">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {!filterType && <th className="px-4 py-2.5 font-semibold text-gray-500">유형</th>}
              <th className="px-4 py-2.5 font-semibold text-gray-500">장비</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500 min-w-[200px]">내용</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500">담당자</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500">날짜</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500">사진</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500">상태</th>
              <th className="px-4 py-2.5 font-semibold text-gray-500"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">로딩 중...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">해당하는 이력이 없습니다.</td></tr>
            )}
            {!loading && filtered.map((log) => {
              const badge = eventBadge[log.eventType];
              return (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                  {!filterType && (
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>
                        {badge.label}
                      </span>
                    </td>
                  )}
                  <td className="px-4 py-2.5 font-medium text-gray-900">{log.equipmentName}</td>
                  <td className="px-4 py-2.5 text-gray-600">
                    <p className="line-clamp-2">{log.description}</p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600">{log.operator}</td>
                  <td className="px-4 py-2.5 text-gray-500 whitespace-nowrap">{formatDate(log.occurredAt)}</td>
                  <td className="px-4 py-2.5">
                    {log.photoUrls && log.photoUrls.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-gray-400">
                        <Camera size={12} /> {log.photoUrls.length}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        log.status === "처리중" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                      }`}
                    >
                      {log.status}
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
