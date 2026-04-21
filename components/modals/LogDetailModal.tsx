"use client";

import { useState } from "react";
import { X, Trash2 as TrashIcon, ChevronLeft, ChevronRight } from "lucide-react";
import type { EventType, EquipmentLog } from "@/lib/types";

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  logId: number | null;
  logs: EquipmentLog[];
}

const eventBadge: Record<EventType, { label: string; cls: string }> = {
  repair: { label: "수리", cls: "bg-[#fee2e2] text-[#dc2626]" },
  vent: { label: "Vent", cls: "bg-[#dbeafe] text-[#1d4ed8]" },
  cleaning: { label: "클리닝", cls: "bg-[#d1fae5] text-[#047857]" },
};

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function LogDetailModal({ isOpen, onClose, onSave, logId, logs }: LogDetailModalProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deletedPhotoIds, setDeletedPhotoIds] = useState<Set<number>>(new Set());

  if (!isOpen || logId === null) return null;

  const log = logs.find((l) => l.id === logId);
  if (!log) return null;

  const badge = eventBadge[log.eventType];
  const relatedLogs = logs.filter((l) => l.equipmentId === log.equipmentId)
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, 5);

  const visiblePhotos = (log.photos || []).filter((p) => !deletedPhotoIds.has(p.id));

  async function handleComplete() {
    setActionLoading(true);
    try {
      await fetch("/api/logs", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: log!.id, status: "완료" }),
      });
      onSave?.();
      onClose();
    } catch (error) {
      console.error("Complete error:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setActionLoading(true);
    try {
      await fetch("/api/logs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: log!.id }),
      });
      onSave?.();
      onClose();
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeletePhoto(photoId: number) {
    if (!confirm("사진을 삭제하시겠습니까?")) return;
    try {
      await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
      setDeletedPhotoIds((prev) => new Set(prev).add(photoId));
      if (lightboxIndex !== null) setLightboxIndex(null);
    } catch (error) {
      console.error("Delete photo error:", error);
    }
  }

  function openLightbox(idx: number) { setLightboxIndex(idx); }
  function closeLightbox() { setLightboxIndex(null); }
  function prevPhoto() {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex > 0 ? lightboxIndex - 1 : visiblePhotos.length - 1);
  }
  function nextPhoto() {
    if (lightboxIndex === null) return;
    setLightboxIndex(lightboxIndex < visiblePhotos.length - 1 ? lightboxIndex + 1 : 0);
  }

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
        <div className="mx-4 w-full max-w-lg rounded-[14px] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
            <h2 className="text-[15px] font-bold text-gray-900">이력 상세</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${badge.cls}`}>{badge.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${log.status === "처리중" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{log.status}</span>
              </div>
              <p className="text-[14px] font-bold text-gray-900">{log.equipmentName} {log.symptom ? `— ${log.symptom}` : ""}</p>
              <p className="text-[11px] text-gray-500">{log.operator} · {formatDate(log.occurredAt)}</p>
            </div>

            <div className="rounded-lg border border-gray-100 text-[12px]">
              <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">장비</span><span className="px-3 py-2 text-gray-800">{log.equipmentName}</span></div>
              <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">담당자</span><span className="px-3 py-2 text-gray-800">{log.operator}</span></div>
              <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">발생 일시</span><span className="px-3 py-2 text-gray-800">{formatDate(log.occurredAt)}</span></div>

              {log.eventType === "repair" && (
                <>
                  <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">증상</span><span className="px-3 py-2 text-gray-800">{log.symptom || "-"}</span></div>
                  <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">교체 부품</span><span className="px-3 py-2 text-gray-800">{log.replacedParts || "-"}</span></div>
                  {log.isExternal && (<div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">외부 업체</span><span className="px-3 py-2 text-gray-800">{log.vendorName || "-"}</span></div>)}
                  {log.status === "완료" && (
                    <div className="grid grid-cols-[100px_1fr] border-b border-gray-50">
                      <span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">완료 일시</span>
                      <span className="px-3 py-2 text-gray-800">{formatDate(log.completedAt)}</span>
                    </div>
                  )}
                </>
              )}
              {log.eventType === "vent" && (
                <>
                  <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">Vent 사유</span><span className="px-3 py-2 text-gray-800">{log.ventReason || "-"}</span></div>
                  <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">도달 압력</span><span className="px-3 py-2 text-gray-800">{log.finalPressure || "-"}</span></div>
                  <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">Pump-down</span><span className="px-3 py-2 text-gray-800">{formatDate(log.pumpedDownAt)}</span></div>
                </>
              )}
              {log.eventType === "cleaning" && (
                <>
                  <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">클리닝 유형</span><span className="px-3 py-2 text-gray-800">{log.cleaningType || "-"}</span></div>
                  <div className="grid grid-cols-[100px_1fr] border-b border-gray-50"><span className="bg-gray-50 px-3 py-2 font-medium text-gray-500">다음 예정</span><span className="px-3 py-2 text-gray-800">{log.nextScheduledAt ? new Date(log.nextScheduledAt).toLocaleDateString("ko-KR") : "-"}</span></div>
                </>
              )}
            </div>

            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-gray-500">상세 내용</p>
              <div className="rounded-lg bg-gray-50 px-3 py-2.5 text-[12px] leading-relaxed text-gray-700">{log.description || "-"}</div>
            </div>

            {visiblePhotos.length > 0 && (
              <div>
                <p className="mb-1.5 text-[11px] font-semibold text-gray-500">첨부 사진 ({visiblePhotos.length})</p>
                <div className="grid grid-cols-4 gap-2">
                  {visiblePhotos.map((photo, idx) => (
                    <div key={photo.id} className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/api/photos/${photo.id}`}
                        alt={photo.fileName}
                        className="h-full w-full object-cover cursor-pointer"
                        onClick={() => openLightbox(idx)}
                      />
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeletePhoto(photo.id); }}
                        className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow group-hover:flex"
                      >
                        <TrashIcon size={10} />
                      </button>
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
                        <p className="text-[10px] text-gray-400">{formatDate(rl.occurredAt)} · {rl.operator}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
            <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">닫기</button>
            <button onClick={handleDelete} disabled={actionLoading} className="rounded-lg border border-red-200 px-4 py-2 text-[12px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50">삭제</button>
            {log.status === "처리중" && (
              <button onClick={handleComplete} disabled={actionLoading} className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50">완료처리</button>
            )}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && visiblePhotos[lightboxIndex] && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90" onClick={closeLightbox}>
          <button onClick={closeLightbox} className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70">
            <X size={20} />
          </button>

          {visiblePhotos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                className="absolute left-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                className="absolute right-3 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()} className="relative max-h-[90vh] max-w-[90vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/api/photos/${visiblePhotos[lightboxIndex].id}`}
              alt={visiblePhotos[lightboxIndex].fileName}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
            <div className="absolute bottom-0 inset-x-0 flex items-center justify-between rounded-b-lg bg-black/60 px-3 py-2">
              <span className="text-[11px] text-white">{visiblePhotos[lightboxIndex].fileName}</span>
              <span className="text-[11px] text-gray-300">{lightboxIndex + 1} / {visiblePhotos.length}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
