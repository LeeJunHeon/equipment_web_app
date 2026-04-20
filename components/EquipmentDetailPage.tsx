"use client";

import { useState, useEffect, useCallback } from "react";
import { Wrench, Wind, Sparkles, Plus } from "lucide-react";
import type { Equipment, EquipmentLog } from "@/lib/types";

type Tab = "repair" | "maintenance";

interface EquipmentDetailPageProps {
  equipment: Equipment;
  onRegisterRepair: () => void;
  onRegisterVent: () => void;
  onRegisterCleaning: () => void;
  onDetailClick: (logId: number) => void;
  refreshKey: number;
}

export default function EquipmentDetailPage({
  equipment,
  onRegisterRepair,
  onRegisterVent,
  onRegisterCleaning,
  onDetailClick,
  refreshKey,
}: EquipmentDetailPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>("repair");
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/logs?equipmentId=${equipment.id}`);
      if (res.ok) setLogs(await res.json());
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [equipment.id, refreshKey]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const repairLogs = logs.filter((l) => l.eventType === "repair");
  const maintenanceLogs = logs.filter(
    (l) => l.eventType === "vent" || l.eventType === "cleaning"
  );
  const unresolvedRepairs = repairLogs.filter((l) => l.status === "처리중");
  const resolvedRepairs = repairLogs.filter((l) => l.status === "완료");

  const now = new Date();
  function daysSince(dateStr: string) {
    const d = new Date(dateStr);
    return Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  }

  const lastVent = logs
    .filter((l) => l.eventType === "vent")
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];
  const lastCleaning = logs
    .filter((l) => l.eventType === "cleaning")
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))[0];

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-16 bg-gray-100 rounded-xl" />
        <div className="h-10 bg-gray-100 rounded-xl" />
        <div className="h-40 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 장비 기본 정보 */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">{equipment.name}</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">
            {equipment.category ?? "미분류"}
            {equipment.isVentTarget && (
              <span className="ml-1 text-blue-500">· Vent 대상</span>
            )}
          </p>
        </div>
        {unresolvedRepairs.length > 0 ? (
          <span className="rounded-full bg-red-100 text-red-700 text-[11px] font-semibold px-2.5 py-1">
            수리 중 {unresolvedRepairs.length}건
          </span>
        ) : (
          <span className="rounded-full bg-green-100 text-green-700 text-[11px] font-semibold px-2.5 py-1">
            정상 운영
          </span>
        )}
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("repair")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "repair"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Wrench size={15} />
          장비 수리
          {unresolvedRepairs.length > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
              {unresolvedRepairs.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("maintenance")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "maintenance"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Wind size={15} />
          유지 보수
        </button>
      </div>

      {/* 수리 탭 */}
      {activeTab === "repair" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-semibold text-gray-700">
              수리 이력 ({repairLogs.length}건)
            </p>
            <button
              onClick={onRegisterRepair}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} />
              수리 등록
            </button>
          </div>

          {unresolvedRepairs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">처리 중</p>
              {unresolvedRepairs.map((log) => (
                <div key={log.id} className="bg-white rounded-xl border border-red-100 border-l-4 border-l-red-400 p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">
                        {log.symptom ?? "증상 미입력"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {log.occurredAt.split("T")[0]} · {log.operator} ·{" "}
                        <span className="text-red-500 font-medium">{daysSince(log.occurredAt)}일 경과</span>
                      </p>
                    </div>
                    <button
                      onClick={() => onDetailClick(log.id)}
                      className="ml-3 shrink-0 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg"
                    >
                      상세
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {resolvedRepairs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">완료</p>
              {resolvedRepairs.map((log) => (
                <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-gray-700 truncate">
                        {log.symptom ?? "증상 미입력"}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {log.occurredAt.split("T")[0]} · {log.operator}
                      </p>
                    </div>
                    <button
                      onClick={() => onDetailClick(log.id)}
                      className="ml-3 shrink-0 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg"
                    >
                      상세
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {repairLogs.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-[13px]">
              수리 이력이 없습니다.
            </div>
          )}
        </div>
      )}

      {/* 유지 보수 탭 */}
      {activeTab === "maintenance" && (
        <div className="space-y-3">
          {/* 마지막 실시 요약 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Wind size={14} className="text-blue-500" />
                <span className="text-[11px] font-semibold text-gray-600">마지막 Vent</span>
              </div>
              {lastVent ? (
                <>
                  <p className="text-[13px] font-bold text-gray-900">{lastVent.occurredAt.split("T")[0]}</p>
                  <p className="text-[11px] text-gray-400">{daysSince(lastVent.occurredAt)}일 전</p>
                </>
              ) : (
                <p className="text-[12px] text-gray-400">기록 없음</p>
              )}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-green-500" />
                <span className="text-[11px] font-semibold text-gray-600">마지막 클리닝</span>
              </div>
              {lastCleaning ? (
                <>
                  <p className="text-[13px] font-bold text-gray-900">{lastCleaning.occurredAt.split("T")[0]}</p>
                  <p className="text-[11px] text-gray-400">{daysSince(lastCleaning.occurredAt)}일 전</p>
                </>
              ) : (
                <p className="text-[12px] text-gray-400">기록 없음</p>
              )}
            </div>
          </div>

          {/* 등록 버튼 */}
          <div className="flex gap-2">
            {equipment.isVentTarget && (
              <button
                onClick={onRegisterVent}
                className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={13} />
                Vent 등록
              </button>
            )}
            <button
              onClick={onRegisterCleaning}
              className="flex items-center gap-1.5 bg-green-50 hover:bg-green-100 text-green-700 text-[12px] font-medium px-3 py-1.5 rounded-lg transition-colors"
            >
              <Plus size={13} />
              클리닝 등록
            </button>
          </div>

          {/* 유지 보수 이력 */}
          <div className="space-y-2">
            <p className="text-[13px] font-semibold text-gray-700">
              유지 보수 이력 ({maintenanceLogs.length}건)
            </p>
            {maintenanceLogs
              .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
              .map((log) => (
                <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {log.eventType === "vent" ? (
                      <Wind size={15} className="text-blue-400 shrink-0" />
                    ) : (
                      <Sparkles size={15} className="text-green-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-gray-800">
                        {log.eventType === "vent" ? "Vent" : "클리닝"}
                        {log.ventReason && ` · ${log.ventReason}`}
                        {log.cleaningType && ` · ${log.cleaningType}`}
                      </p>
                      <p className="text-[11px] text-gray-400">
                        {log.occurredAt.split("T")[0]} · {log.operator}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => onDetailClick(log.id)}
                    className="ml-3 shrink-0 text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg"
                  >
                    상세
                  </button>
                </div>
              ))}
            {maintenanceLogs.length === 0 && (
              <div className="py-12 text-center text-gray-400 text-[13px]">
                유지 보수 이력이 없습니다.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
