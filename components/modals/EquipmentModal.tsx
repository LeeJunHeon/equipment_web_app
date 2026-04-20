"use client";

import { useState, useEffect } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import type { Equipment } from "@/lib/types";

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EquipmentModal({ isOpen, onClose }: EquipmentModalProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formIsVent, setFormIsVent] = useState(false);
  const [formVentInterval, setFormVentInterval] = useState(30);
  const [formCleaningInterval, setFormCleaningInterval] = useState(14);

  useEffect(() => {
    if (!isOpen) return;
    fetchEquipments();
  }, [isOpen]);

  async function fetchEquipments() {
    setLoading(true);
    try {
      const res = await fetch("/api/equipment");
      if (res.ok) setEquipments(await res.json());
    } catch (error) {
      console.error("Failed to fetch equipments:", error);
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  function startEdit(eq: Equipment) {
    setEditingId(eq.id);
    setFormName(eq.name);
    setFormCategory(eq.category || "");
    setFormIsVent(eq.isVentTarget);
    setFormVentInterval(eq.ventIntervalDays ?? 30);
    setFormCleaningInterval(eq.cleaningIntervalDays ?? 14);
    setIsAdding(false);
  }

  function startAdd() {
    setIsAdding(true);
    setEditingId(null);
    setFormName("");
    setFormCategory("");
    setFormIsVent(false);
    setFormVentInterval(30);
    setFormCleaningInterval(14);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsAdding(false);
    setFormName("");
    setFormCategory("");
    setFormIsVent(false);
    setFormVentInterval(30);
    setFormCleaningInterval(14);
  }

  async function saveEdit() {
    if (!formName.trim()) return;

    try {
      if (isAdding) {
        const res = await fetch("/api/equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formName, category: formCategory, isVentTarget: formIsVent, ventIntervalDays: formVentInterval, cleaningIntervalDays: formCleaningInterval }),
        });
        if (!res.ok) return;
      } else if (editingId !== null) {
        const res = await fetch("/api/equipment", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, name: formName, category: formCategory, isVentTarget: formIsVent, ventIntervalDays: formVentInterval, cleaningIntervalDays: formCleaningInterval }),
        });
        if (!res.ok) return;
      }
      cancelEdit();
      await fetchEquipments();
    } catch (error) {
      console.error("Save equipment error:", error);
    }
  }

  async function deleteEquipment(id: number) {
    if (!confirm("정말 비활성화하시겠습니까?")) return;
    try {
      await fetch("/api/equipment", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchEquipments();
    } catch (error) {
      console.error("Delete equipment error:", error);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="mx-4 w-full max-w-lg rounded-[14px] bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h2 className="text-[15px] font-bold text-gray-900">장비 목록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
          <button
            onClick={startAdd}
            className="mb-3 flex w-full items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 py-2 text-[12px] font-medium text-gray-500 transition-colors hover:border-blue-300 hover:text-blue-600"
          >
            <Plus size={14} /> 장비 추가
          </button>

          {isAdding && (
            <div className="mb-3 space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
              <input type="text" placeholder="장비명" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" />
              <input type="text" placeholder="카테고리" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" />
              <label className="flex items-center gap-2 text-[12px] text-gray-600">
                <input type="checkbox" checked={formIsVent} onChange={(e) => setFormIsVent(e.target.checked)} className="rounded" />
                Vent 기록 대상
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-gray-500">Vent 주기 (일)</label>
                  <input
                    type="number"
                    min={1}
                    value={formVentInterval}
                    onChange={(e) => setFormVentInterval(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-semibold text-gray-500">클리닝 주기 (일)</label>
                  <input
                    type="number"
                    min={1}
                    value={formCleaningInterval}
                    onChange={(e) => setFormCleaningInterval(Math.max(1, Number(e.target.value)))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={cancelEdit} className="rounded px-3 py-1 text-[11px] text-gray-500 hover:bg-gray-100">취소</button>
                <button onClick={saveEdit} className="rounded bg-blue-600 px-3 py-1 text-[11px] text-white hover:bg-blue-700">저장</button>
              </div>
            </div>
          )}

          {loading && <p className="text-center text-[12px] text-gray-400 py-4">로딩 중...</p>}

          <div className="space-y-1">
            {equipments.map((eq) => (
              <div key={eq.id}>
                {editingId === eq.id ? (
                  <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" />
                    <input type="text" value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400" />
                    <label className="flex items-center gap-2 text-[12px] text-gray-600">
                      <input type="checkbox" checked={formIsVent} onChange={(e) => setFormIsVent(e.target.checked)} className="rounded" />
                      Vent 기록 대상
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500">Vent 주기 (일)</label>
                        <input
                          type="number"
                          min={1}
                          value={formVentInterval}
                          onChange={(e) => setFormVentInterval(Math.max(1, Number(e.target.value)))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[10px] font-semibold text-gray-500">클리닝 주기 (일)</label>
                        <input
                          type="number"
                          min={1}
                          value={formCleaningInterval}
                          onChange={(e) => setFormCleaningInterval(Math.max(1, Number(e.target.value)))}
                          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={cancelEdit} className="rounded px-3 py-1 text-[11px] text-gray-500 hover:bg-gray-100">취소</button>
                      <button onClick={saveEdit} className="rounded bg-blue-600 px-3 py-1 text-[11px] text-white hover:bg-blue-700">저장</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5 hover:bg-gray-50">
                    <div>
                      <p className="text-[12px] font-medium text-gray-900">{eq.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-gray-500">{eq.category}</span>
                        {eq.isVentTarget && (
                          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-medium text-blue-600">Vent 대상</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => startEdit(eq)} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteEquipment(eq.id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end border-t border-gray-100 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50">
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
