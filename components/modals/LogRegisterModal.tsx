"use client";

import { useState, useEffect } from "react";
import { X, Wrench, Wind, Trash2 } from "lucide-react";
import type { EventType, Equipment, StatusType } from "@/lib/types";
import PhotoUploader from "@/components/ui/PhotoUploader";

interface LogRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  defaultEventType?: "repair" | "vent" | "cleaning";
  defaultEquipmentId?: number;
}

export default function LogRegisterModal({
  isOpen,
  onClose,
  onSave,
  defaultEventType,
  defaultEquipmentId,
}: LogRegisterModalProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [eventType, setEventType] = useState<EventType>("repair");
  const [equipmentId, setEquipmentId] = useState("");
  const [operator, setOperator] = useState("이준헌");
  const [occurredAt, setOccurredAt] = useState("");
  const [description, setDescription] = useState("");
  const [symptom, setSymptom] = useState("");
  const [partsList, setPartsList] = useState<{ name: string; qty: number }[]>([]);
  const [newPartName, setNewPartName] = useState("");
  const [newPartQty, setNewPartQty] = useState(1);
  const [isExternal, setIsExternal] = useState("자체수리");
  const [vendorName, setVendorName] = useState("");
  const [repairStatus, setRepairStatus] = useState<StatusType>("처리중");
  const [ventReason, setVentReason] = useState("타겟 교체");
  const [finalPressure, setFinalPressure] = useState("");
  const [pumpedDownAt, setPumpedDownAt] = useState("");
  const [cleaningType, setCleaningType] = useState("정기 클리닝");
  const [nextScheduledAt, setNextScheduledAt] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setError("");
    setSelectedFiles([]);
    setPartsList([]);
    setNewPartName("");
    setNewPartQty(1);
    if (defaultEventType) setEventType(defaultEventType);
    if (defaultEquipmentId) setEquipmentId(String(defaultEquipmentId));
    async function fetchEquipments() {
      try {
        const res = await fetch("/api/equipment");
        if (res.ok) setEquipments(await res.json());
      } catch (err) {
        console.error("Failed to fetch equipments:", err);
        setEquipments([]);
      }
    }
    fetchEquipments();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEquipments = eventType === "vent" ? equipments.filter((e) => e.isVentTarget) : equipments;

  const typeButtons: { type: EventType; label: string; icon: typeof Wrench }[] = [
    { type: "repair", label: "수리🔧", icon: Wrench },
    { type: "vent", label: "Vent💨", icon: Wind },
    { type: "cleaning", label: "클리닝🧹", icon: Trash2 },
  ];

  async function handleSave() {
    if (!equipmentId) { setError("장비를 선택해주세요."); return; }
    if (!description.trim()) { setError("내용을 입력해주세요."); return; }

    setSaving(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        equipmentId: Number(equipmentId),
        eventType,
        occurredAt: occurredAt || new Date().toISOString(),
        operator,
        description,
        status: eventType === "repair" ? repairStatus : "완료",
      };

      if (eventType === "repair") {
        body.symptom = symptom || null;
        body.replacedParts =
          partsList.length > 0 ? JSON.stringify(partsList) : null;
        body.isExternal = isExternal === "외부업체";
        body.vendorName = isExternal === "외부업체" ? vendorName : null;
      }
      if (eventType === "vent") {
        body.ventReason = ventReason || null;
        body.finalPressure = finalPressure || null;
        body.pumpedDownAt = pumpedDownAt || null;
      }
      if (eventType === "cleaning") {
        body.cleaningType = cleaningType || null;
        body.nextScheduledAt = nextScheduledAt || null;
      }

      const res = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "저장에 실패했습니다.");
        return;
      }

      const created = await res.json();
      const logId = created.id;

      for (const file of selectedFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("logId", String(logId));
        const uploadRes = await fetch("/api/upload", { method: "POST", body: fd });
        if (!uploadRes.ok) {
          console.error("Upload failed for:", file.name);
        }
      }

      onSave?.();
      onClose();
    } catch (err) {
      console.error("Save log error:", err);
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-[14px] bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[15px] font-bold text-gray-900">이력 등록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">유형 선택</label>
            <div className="flex gap-2">
              {typeButtons.map((btn) => (
                <button key={btn.type} onClick={() => setEventType(btn.type)} className={`flex-1 rounded-lg border py-2 text-[12px] font-medium transition-colors ${eventType === btn.type ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{btn.label}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">장비 선택</label>
            <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400">
              <option value="">장비를 선택하세요</option>
              {filteredEquipments.map((eq) => (<option key={eq.id} value={eq.id}>{eq.name} — {eq.category}</option>))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">담당자</label>
              <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"><option>이준헌</option><option>박민준</option></select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">발생 일시</label>
              <input type="datetime-local" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">내용</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400 resize-none" placeholder="상세 내용을 입력하세요..." />
          </div>

          {eventType === "repair" && (
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold text-gray-500">수리 정보</p>
              <div><label className="mb-1 block text-[11px] text-gray-500">고장 증상</label><input type="text" value={symptom} onChange={(e) => setSymptom(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" /></div>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">교체 부품</label>

                {partsList.length > 0 && (
                  <div className="mb-2 space-y-1">
                    {partsList.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg bg-white border border-gray-200 px-3 py-1.5">
                        <span className="flex-1 text-[12px] text-gray-800">{p.name}</span>
                        <span className="text-[12px] text-gray-500">{p.qty}개</span>
                        <button
                          type="button"
                          onClick={() => setPartsList((prev) => prev.filter((_, idx) => idx !== i))}
                          className="text-gray-300 hover:text-red-400 text-[11px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={newPartName}
                    onChange={(e) => setNewPartName(e.target.value)}
                    placeholder="부품명 (예: 볼트)"
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newPartName.trim()) {
                        e.preventDefault();
                        setPartsList((prev) => [...prev, { name: newPartName.trim(), qty: newPartQty }]);
                        setNewPartName("");
                        setNewPartQty(1);
                      }
                    }}
                  />
                  <input
                    type="number"
                    min={1}
                    value={newPartQty}
                    onChange={(e) => setNewPartQty(Math.max(1, Number(e.target.value)))}
                    className="w-16 rounded-lg border border-gray-200 px-2 py-2 text-[12px] outline-none focus:border-blue-400 text-center"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newPartName.trim()) return;
                      setPartsList((prev) => [...prev, { name: newPartName.trim(), qty: newPartQty }]);
                      setNewPartName("");
                      setNewPartQty(1);
                    }}
                    className="rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 whitespace-nowrap"
                  >
                    + 추가
                  </button>
                </div>
                <p className="mt-1 text-[10px] text-gray-400">부품명 입력 후 Enter 또는 + 추가 클릭</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="mb-1 block text-[11px] text-gray-500">외부 업체 여부</label><select value={isExternal} onChange={(e) => setIsExternal(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"><option>자체수리</option><option>외부업체</option></select></div>
                {isExternal === "외부업체" && (<div><label className="mb-1 block text-[11px] text-gray-500">업체명</label><input type="text" value={vendorName} onChange={(e) => setVendorName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" /></div>)}
              </div>
              <div><label className="mb-1 block text-[11px] text-gray-500">완료 여부</label><select value={repairStatus} onChange={(e) => setRepairStatus(e.target.value as StatusType)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"><option>처리중</option><option>완료</option></select></div>
            </div>
          )}

          {eventType === "vent" && (
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold text-gray-500">Vent 정보</p>
              <div><label className="mb-1 block text-[11px] text-gray-500">Vent 사유</label><select value={ventReason} onChange={(e) => setVentReason(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"><option>타겟 교체</option><option>정기 점검</option><option>수리</option><option>클리닝</option><option>기타</option></select></div>
              <div><label className="mb-1 block text-[11px] text-gray-500">도달 압력</label><input type="text" value={finalPressure} onChange={(e) => setFinalPressure(e.target.value)} placeholder="예: 3.2e-6 Torr" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" /></div>
              <div><label className="mb-1 block text-[11px] text-gray-500">Pump-down 완료 시각</label><input type="datetime-local" value={pumpedDownAt} onChange={(e) => setPumpedDownAt(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" /></div>
            </div>
          )}

          {eventType === "cleaning" && (
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold text-gray-500">클리닝 정보</p>
              <div><label className="mb-1 block text-[11px] text-gray-500">클리닝 유형</label><select value={cleaningType} onChange={(e) => setCleaningType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"><option>정기 클리닝</option><option>챔버 세정</option><option>비정기</option><option>기타</option></select></div>
              <div><label className="mb-1 block text-[11px] text-gray-500">다음 클리닝 예정일</label><input type="date" value={nextScheduledAt} onChange={(e) => setNextScheduledAt(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" /></div>
            </div>
          )}

          <PhotoUploader
            onFilesChange={setSelectedFiles}
            maxFiles={10}
            disabled={saving}
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button onClick={onClose} disabled={saving} className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50">취소</button>
          <button onClick={handleSave} disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
