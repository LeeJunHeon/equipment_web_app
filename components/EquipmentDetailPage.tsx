"use client";

import { useState, useEffect, useCallback } from "react";
import { Wrench, Wind, Sparkles, Plus, ChevronDown, ChevronRight, ImageIcon, Package } from "lucide-react";
import type { Equipment, EquipmentLog, LogEntry } from "@/lib/types";
import RepairEntryModal from "@/components/modals/RepairEntryModal";
import { getPmStatus, getPmStatusLabel, getPmStatusColor, PM_CONFIG } from "@/lib/pmConfig";

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

  // 일일 기록: logId → LogEntry[]
  const [entriesMap, setEntriesMap] = useState<Record<number, LogEntry[]>>({});
  const [expandedLogIds, setExpandedLogIds] = useState<Set<number>>(new Set());
  const [loadingEntries, setLoadingEntries] = useState<Set<number>>(new Set());

  // RepairEntryModal 상태
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [entryTargetLogId, setEntryTargetLogId] = useState<number | null>(null);

  const [partsSummary, setPartsSummary] = useState<
    { name: string; count: number; totalQty: number; lastDate: string }[]
  >([]);
  const [partsLoading, setPartsLoading] = useState(false);

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
    // 장비가 바뀌면 펼침 상태 초기화
    setExpandedLogIds(new Set());
    setEntriesMap({});
  }, [fetchLogs]);

  const fetchParts = useCallback(async () => {
    setPartsLoading(true);
    try {
      const res = await fetch(`/api/parts-summary?equipmentId=${equipment.id}`);
      if (res.ok) setPartsSummary(await res.json());
    } catch {
      setPartsSummary([]);
    } finally {
      setPartsLoading(false);
    }
  }, [equipment.id, refreshKey]);

  useEffect(() => {
    fetchParts();
  }, [fetchParts]);

  // 특정 수리 케이스의 일일 기록 로드
  async function loadEntries(logId: number) {
    if (entriesMap[logId]) return; // 이미 로드됨
    setLoadingEntries((prev) => new Set(prev).add(logId));
    try {
      const res = await fetch(`/api/logs/${logId}/entries`);
      if (res.ok) {
        const data: LogEntry[] = await res.json();
        setEntriesMap((prev) => ({ ...prev, [logId]: data }));
      }
    } catch {
      setEntriesMap((prev) => ({ ...prev, [logId]: [] }));
    } finally {
      setLoadingEntries((prev) => {
        const next = new Set(prev);
        next.delete(logId);
        return next;
      });
    }
  }

  // 날짜 토글
  async function toggleExpand(logId: number) {
    const next = new Set(expandedLogIds);
    if (next.has(logId)) {
      next.delete(logId);
    } else {
      next.add(logId);
      await loadEntries(logId);
    }
    setExpandedLogIds(next);
  }

  // 일일 기록 저장 후 해당 케이스 엔트리 새로고침
  async function handleEntrySaved() {
    if (entryTargetLogId === null) return;
    // 캐시 무효화 후 다시 로드
    setEntriesMap((prev) => {
      const next = { ...prev };
      delete next[entryTargetLogId];
      return next;
    });
    await loadEntries(entryTargetLogId);
    // 자동으로 펼침
    setExpandedLogIds((prev) => new Set(prev).add(entryTargetLogId));
  }

  // 날짜별 그룹핑 헬퍼
  function groupEntriesByDate(entries: LogEntry[]) {
    const map: Record<string, LogEntry[]> = {};
    for (const e of entries) {
      const date = e.occurredAt.split("T")[0];
      if (!map[date]) map[date] = [];
      map[date].push(e);
    }
    // 날짜 내림차순, 각 날짜 내에서는 시간 오름차순
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, list]) => ({
        date,
        entries: list.sort((a, b) => a.occurredAt.localeCompare(b.occurredAt)),
      }));
  }

  function formatTime(isoStr: string) {
    const d = new Date(isoStr);
    return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${y.slice(2)}.${m}.${d}`;
  }

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

  // 수리 카드 렌더링 (처리중/완료 공용)
  function renderRepairCard(log: EquipmentLog) {
    const isExpanded = expandedLogIds.has(log.id);
    const isLoading = loadingEntries.has(log.id);
    const entries = entriesMap[log.id] ?? [];
    const grouped = groupEntriesByDate(entries);
    const isUnresolved = log.status === "처리중";

    return (
      <div
        key={log.id}
        className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
          isUnresolved
            ? "border-red-100 border-l-4 border-l-red-400"
            : "border-gray-100"
        }`}
      >
        {/* 케이스 헤더 */}
        <div className="p-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className={`text-[13px] font-semibold truncate ${isUnresolved ? "text-gray-900" : "text-gray-700"}`}>
                {log.symptom ?? "증상 미입력"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {log.occurredAt.split("T")[0]} · {log.operator}
                {isUnresolved && (
                  <span className="ml-1 text-red-500 font-medium">
                    · {daysSince(log.occurredAt)}일 경과
                  </span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-1.5 ml-2 shrink-0">
              <button
                onClick={() => onDetailClick(log.id)}
                className="text-[11px] font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg"
              >
                상세
              </button>
            </div>
          </div>

          {/* 일일 기록 토글 버튼 */}
          <button
            onClick={() => toggleExpand(log.id)}
            className="mt-2 flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
          >
            {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            진행 기록
            {entries.length > 0 && (
              <span className="ml-1 text-gray-400">({entries.length}건)</span>
            )}
          </button>
        </div>

        {/* 일일 기록 펼침 영역 */}
        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50 px-3 py-2 space-y-3">
            {isLoading && (
              <div className="py-3 text-center text-[12px] text-gray-400 animate-pulse">
                로딩 중...
              </div>
            )}

            {!isLoading && grouped.length === 0 && (
              <div className="py-3 text-center text-[12px] text-gray-400">
                아직 진행 기록이 없습니다.
              </div>
            )}

            {!isLoading && grouped.map(({ date, entries: dayEntries }) => (
              <div key={date}>
                <p className="text-[10px] font-bold text-gray-500 mb-1.5">
                  {formatDate(date)}
                </p>
                <div className="space-y-1.5 pl-2 border-l-2 border-gray-200">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="flex gap-2 text-[11px]">
                      <span className="text-gray-400 shrink-0 pt-0.5">
                        {formatTime(entry.occurredAt)}
                      </span>
                      <div className="min-w-0 flex-1">
                        {entry.memo && (
                          <p className="text-gray-700 leading-relaxed">{entry.memo}</p>
                        )}
                        {entry.photos.length > 0 && (
                          <div className="flex items-center gap-1 mt-0.5 text-gray-400">
                            <ImageIcon size={11} />
                            <span>사진 {entry.photos.length}장</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* 오늘 기록 추가 버튼 */}
            <button
              onClick={() => {
                setEntryTargetLogId(log.id);
                setShowEntryModal(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-300 text-[11px] font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus size={12} />
              오늘 기록 추가
            </button>
          </div>
        )}
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
              {unresolvedRepairs.map(renderRepairCard)}
            </div>
          )}

          {resolvedRepairs.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">완료</p>
              {resolvedRepairs.map(renderRepairCard)}
            </div>
          )}

          {repairLogs.length === 0 && (
            <div className="py-12 text-center text-gray-400 text-[13px]">
              수리 이력이 없습니다.
            </div>
          )}

          {/* 교체 부품 이력 */}
          {(partsSummary.length > 0 || partsLoading) && (
            <div className="mt-4">
              <h3 className="flex items-center gap-2 text-[13px] font-semibold text-gray-700 mb-2">
                <Package size={14} className="text-gray-400" />
                교체 부품 이력
              </h3>
              {partsLoading ? (
                <div className="space-y-1.5">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                  <table className="w-full text-[12px]">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-3 py-2 text-left font-semibold text-gray-500">부품명</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-500">교체 횟수</th>
                        <th className="px-3 py-2 text-center font-semibold text-gray-500">총 수량</th>
                        <th className="px-3 py-2 text-right font-semibold text-gray-500">최근 교체</th>
                      </tr>
                    </thead>
                    <tbody>
                      {partsSummary.map((p, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0">
                          <td className="px-3 py-2 font-medium text-gray-800">{p.name}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.count >= 3
                                ? "bg-red-100 text-red-700"
                                : p.count >= 2
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-gray-100 text-gray-600"
                            }`}>
                              {p.count}회
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center text-gray-600">{p.totalQty}개</td>
                          <td className="px-3 py-2 text-right text-gray-400">
                            {p.lastDate.split("T")[0]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 유지 보수 탭 */}
      {activeTab === "maintenance" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Wind size={14} className="text-blue-500" />
                <span className="text-[11px] font-semibold text-gray-600">마지막 Vent</span>
              </div>
              {(() => {
                const ventStatus = getPmStatus(lastVent?.occurredAt, equipment.ventIntervalDays ?? PM_CONFIG.ventIntervalDays);
                const color = getPmStatusColor(ventStatus);
                return lastVent ? (
                  <>
                    <p className="text-[13px] font-bold text-gray-900">{lastVent.occurredAt.split("T")[0]}</p>
                    <p className="text-[11px] text-gray-400">{daysSince(lastVent.occurredAt)}일 전</p>
                    <span className={`mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                      {getPmStatusLabel(ventStatus)} (주기 {equipment.ventIntervalDays ?? PM_CONFIG.ventIntervalDays}일)
                    </span>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-gray-400">기록 없음</p>
                    <span className="mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                      주기 초과
                    </span>
                  </>
                );
              })()}
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles size={14} className="text-green-500" />
                <span className="text-[11px] font-semibold text-gray-600">마지막 클리닝</span>
              </div>
              {(() => {
                const cleaningStatus = getPmStatus(lastCleaning?.occurredAt, equipment.cleaningIntervalDays ?? PM_CONFIG.cleaningIntervalDays);
                const color = getPmStatusColor(cleaningStatus);
                return lastCleaning ? (
                  <>
                    <p className="text-[13px] font-bold text-gray-900">{lastCleaning.occurredAt.split("T")[0]}</p>
                    <p className="text-[11px] text-gray-400">{daysSince(lastCleaning.occurredAt)}일 전</p>
                    <span className={`mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full ${color.bg} ${color.text}`}>
                      {getPmStatusLabel(cleaningStatus)} (주기 {equipment.cleaningIntervalDays ?? PM_CONFIG.cleaningIntervalDays}일)
                    </span>
                  </>
                ) : (
                  <>
                    <p className="text-[12px] text-gray-400">기록 없음</p>
                    <span className="mt-1 inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                      주기 초과
                    </span>
                  </>
                );
              })()}
            </div>
          </div>

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

      {/* 진행 기록 추가 모달 */}
      {entryTargetLogId !== null && (
        <RepairEntryModal
          isOpen={showEntryModal}
          logId={entryTargetLogId}
          onClose={() => {
            setShowEntryModal(false);
            setEntryTargetLogId(null);
          }}
          onSave={handleEntrySaved}
        />
      )}
    </div>
  );
}
