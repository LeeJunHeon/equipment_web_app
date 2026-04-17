"use client";

import { useState } from "react";
import { X, Wrench, Wind, Trash2, Upload } from "lucide-react";
import { EQUIPMENTS } from "@/lib/mockData";
import type { EventType } from "@/lib/types";

interface LogRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogRegisterModal({ isOpen, onClose }: LogRegisterModalProps) {
  const [eventType, setEventType] = useState<EventType>("repair");
  const [equipmentId, setEquipmentId] = useState("");
  const [operator, setOperator] = useState("이준헌");
  const [occurredAt, setOccurredAt] = useState("");
  const [description, setDescription] = useState("");
  const [symptom, setSymptom] = useState("");
  const [replacedParts, setReplacedParts] = useState("");
  const [isExternal, setIsExternal] = useState("자체수리");
  const [vendorName, setVendorName] = useState("");
  const [repairStatus, setRepairStatus] = useState("처리중");
  const [ventReason, setVentReason] = useState("타겟 교체");
  const [finalPressure, setFinalPressure] = useState("");
  const [pumpedDownAt, setPumpedDownAt] = useState("");
  const [cleaningType, setCleaningType] = useState("정기 클리닝");
  const [nextScheduledAt, setNextScheduledAt] = useState("");

  if (!isOpen) return null;

  const filteredEquipments = eventType === "vent" ? EQUIPMENTS.filter((e) => e.isVentTarget) : EQUIPMENTS;

  const typeButtons: { type: EventType; label: string; icon: typeof Wrench }[] = [
    { type: "repair", label: "수리🔧", icon: Wrench },
    { type: "vent", label: "Vent💨", icon: Wind },
    { type: "cleaning", label: "클리닝🧹", icon: Trash2 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-[14px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[15px] font-bold text-gray-900">이력 등록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">유형 선택</label>
            <div className="flex gap-2">
              {typeButtons.map((btn) => (
                <button
                  key={btn.type}
                  onClick={() => setEventType(btn.type)}
                  className={`flex-1 rounded-lg border py-2 text-[12px] font-medium transition-colors ${
                    eventType === btn.type
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">장비 선택</label>
            <select
              value={equipmentId}
              onChange={(e) => setEquipmentId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
            >
              <option value="">장비를 선택하세요</option>
              {filteredEquipments.map((eq) => (
                <option key={eq.id} value={eq.id}>{eq.name} — {eq.category}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">담당자</label>
              <select
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
              >
                <option>이준헌</option>
                <option>박민준</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">발생 일시</label>
              <input
                type="datetime-local"
                value={occurredAt}
                onChange={(e) => setOccurredAt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">내용</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400 resize-none"
              placeholder="상세 내용을 입력하세요..."
            />
          </div>

          {eventType === "repair" && (
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold text-gray-500">수리 정보</p>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">고장 증상</label>
                <input
                  type="text"
                  value={symptom}
                  onChange={(e) => setSymptom(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">교체 부품</label>
                <input
                  type="text"
                  value={replacedParts}
                  onChange={(e) => setReplacedParts(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] text-gray-500">외부 업체 여부</label>
                  <select
                    value={isExternal}
                    onChange={(e) => setIsExternal(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                  >
                    <option>자체수리</option>
                    <option>외부업체</option>
                  </select>
                </div>
                {isExternal === "외부업체" && (
                  <div>
                    <label className="mb-1 block text-[11px] text-gray-500">업체명</label>
                    <input
                      type="text"
                      value={vendorName}
                      onChange={(e) => setVendorName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">완료 여부</label>
                <select
                  value={repairStatus}
                  onChange={(e) => setRepairStatus(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                >
                  <option>처리중</option>
                  <option>완료</option>
                </select>
              </div>
            </div>
          )}

          {eventType === "vent" && (
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold text-gray-500">Vent 정보</p>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">Vent 사유</label>
                <select
                  value={ventReason}
                  onChange={(e) => setVentReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                >
                  <option>타겟 교체</option>
                  <option>정기 점검</option>
                  <option>수리</option>
                  <option>클리닝</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">도달 압력</label>
                <input
                  type="text"
                  value={finalPressure}
                  onChange={(e) => setFinalPressure(e.target.value)}
                  placeholder="예: 3.2e-6 Torr"
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">Pump-down 완료 시각</label>
                <input
                  type="datetime-local"
                  value={pumpedDownAt}
                  onChange={(e) => setPumpedDownAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                />
              </div>
            </div>
          )}

          {eventType === "cleaning" && (
            <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold text-gray-500">클리닝 정보</p>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">클리닝 유형</label>
                <select
                  value={cleaningType}
                  onChange={(e) => setCleaningType(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                >
                  <option>정기 클리닝</option>
                  <option>챔버 세정</option>
                  <option>비정기</option>
                  <option>기타</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-gray-500">다음 클리닝 예정일</label>
                <input
                  type="date"
                  value={nextScheduledAt}
                  onChange={(e) => setNextScheduledAt(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">사진 첨부</label>
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 py-6 text-gray-400">
              <Upload size={20} className="mb-1" />
              <p className="text-[11px]">클릭하여 사진을 첨부하세요</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
          >
            취소
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
