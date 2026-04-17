"use client";

import { X } from "lucide-react";
import type { EventType, EquipmentLog } from "@/lib/types";

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  logId: number | null;
  logs: EquipmentLog[];
}

const eventBadge: Record<EventType, { label: string; cls: string }> = {
  repair: { label: "수리", cls: "bg-[#fee2e2] text-[#dc2626]" },
  vent: { label: "Vent", cls: "bg-[#dbeafe] text-[#1d4ed8]" },
  cleaning: { label: "클리닝", cls: "bg-[#d1fae5] text-[#047857]" },
};

export default function LogDetailModal({ isOpen, onClose, logId, logs }: LogDetailModalProps) {
  if (!isOpen || logId === null) return null;

  const log = logs.find((l) => l.id === logId);
  if (!log) return null;

  const badge = eventBadge[log.eventType];
  const relatedLogs = logs.filter((l) => l.equipmentId === log.equipmentId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-[14px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[15px] font-bold text-gray-900">이력 상세</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                log.status === "처리중" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
              }`}>{log.status}</span>
            </div>
            <p className="text-[14px] font-bold text-gray-900">
              {log.equipmentName} {log.symptom ? `— ${log.symptom}` : ""}
            </p>
            <p className="text-[11px] text-gray-500">{log.operator} · {log.occurredAt}</p>
          </div>

          <div className="rounded-lg border border-gray-100 text-[12px]">
            <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
              <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">장비</span>
              <span className="px-3 py-2 text-gray-800">{log.equipmentName}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
              <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">담당자</span>
              <span className="px-3 py-2 text-gray-800">{log.operator}</span>
            </div>
            <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
              <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">발생 일시</span>
              <span className="px-3 py-2 text-gray-800">{log.occurredAt}</span>
            </div>

            {log.eventType === "repair" && (
              <>
                <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                  <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">증상</span>
                  <span className="px-3 py-2 text-gray-800">{log.symptom || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                  <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">교체 부품</span>
                  <span className="px-3 py-2 text-gray-800">{log.replacedParts || "-"}</span>
                </div>
                {log.isExternal && (
                  <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                    <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">외부 업체</span>
                    <span className="px-3 py-2 text-gray-800">{log.vendorName || "-"}</span>
                  </div>
                )}
              </>
            )}

            {log.eventType === "vent" && (
              <>
                <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                  <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">Vent 사유</span>
                  <span className="px-3 py-2 text-gray-800">{log.ventReason || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                  <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">도달 압력</span>
                  <span className="px-3 py-2 text-gray-800">{log.finalPressure || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                  <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">Pump-down</span>
                  <span className="px-3 py-2 text-gray-800">{log.pumpedDownAt || "-"}</span>
                </div>
              </>
            )}

            {log.eventType === "cleaning" && (
              <>
                <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                  <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">클리닝 유형</span>
                  <span className="px-3 py-2 text-gray-800">{log.cleaningType || "-"}</span>
                </div>
                <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                  <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">다음 예정</span>
                  <span className="px-3 py-2 text-gray-800">{log.nextScheduledAt || "-"}</span>
                </div>
              </>
            )}
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold text-gray-500">상세 내용</p>
            <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-[12px] leading-relaxed text-gray-700">
              {log.description}
            </div>
          </div>

          {log.photoCount > 0 && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-gray-500">첨부 사진 ({log.photoCount})</p>
              <div className="flex gap-2">
                {Array.from({ length: log.photoCount }).map((_, i) => (
                  <div key={i} className="flex h-20 w-20 items-center justify-center rounded-lg bg-gray-100 text-[10px] text-gray-400">
                    사진 {i + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-[11px] font-semibold text-gray-500">최근 이력 ({log.equipmentName})</p>
            <div className="space-y-0">
              {relatedLogs.map((rl) => {
                const rlBadge = eventBadge[rl.eventType];
                return (
                  <div key={rl.id} className="flex items-start gap-2 border-l-2 border-gray-200 py-1.5 pl-3">
                    <div className="mt-0.5 h-2 w-2 -ml-[17px] rounded-full bg-gray-300" />
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${rlBadge.cls}`}>{rlBadge.label}</span>
                        <span className="text-[11px] text-gray-700 line-clamp-1">{rl.description}</span>
                      </div>
                      <p className="text-[10px] text-gray-400">{rl.occurredAt} · {rl.operator}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
          >
            닫기
          </button>
          <button className="rounded-lg border border-red-200 px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50">
            삭제
          </button>
          <button className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700">
            수정
          </button>
        </div>
      </div>
    </div>
  );
}
