"use client";

import { useState } from "react";
import { X, Plus, Pencil, Trash2 } from "lucide-react";
import { EQUIPMENTS } from "@/lib/mockData";
import type { Equipment } from "@/lib/types";

interface EquipmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EquipmentModal({ isOpen, onClose }: EquipmentModalProps) {
  const [equipments, setEquipments] = useState<Equipment[]>([...EQUIPMENTS]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formIsVent, setFormIsVent] = useState(false);

  if (!isOpen) return null;

  function startEdit(eq: Equipment) {
    setEditingId(eq.id);
    setFormName(eq.name);
    setFormCategory(eq.category);
    setFormIsVent(eq.isVentTarget);
    setIsAdding(false);
  }

  function startAdd() {
    setIsAdding(true);
    setEditingId(null);
    setFormName("");
    setFormCategory("");
    setFormIsVent(false);
  }

  function saveEdit() {
    if (!formName.trim()) return;
    if (isAdding) {
      const newId = Math.max(...equipments.map((e) => e.id), 0) + 1;
      setEquipments([...equipments, { id: newId, name: formName, category: formCategory, isVentTarget: formIsVent }]);
    } else if (editingId !== null) {
      setEquipments(equipments.map((e) => e.id === editingId ? { ...e, name: formName, category: formCategory, isVentTarget: formIsVent } : e));
    }
    cancelEdit();
  }

  function cancelEdit() {
    setEditingId(null);
    setIsAdding(false);
    setFormName("");
    setFormCategory("");
    setFormIsVent(false);
  }

  function deleteEquipment(id: number) {
    setEquipments(equipments.filter((e) => e.id !== id));
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
              <input
                type="text"
                placeholder="장비명"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
              />
              <input
                type="text"
                placeholder="카테고리"
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
              />
              <label className="flex items-center gap-2 text-[12px] text-gray-600">
                <input
                  type="checkbox"
                  checked={formIsVent}
                  onChange={(e) => setFormIsVent(e.target.checked)}
                  className="rounded"
                />
                Vent 기록 대상
              </label>
              <div className="flex justify-end gap-2">
                <button onClick={cancelEdit} className="rounded px-3 py-1 text-[11px] text-gray-500 hover:bg-gray-100">취소</button>
                <button onClick={saveEdit} className="rounded bg-blue-600 px-3 py-1 text-[11px] text-white hover:bg-blue-700">저장</button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {equipments.map((eq) => (
              <div key={eq.id}>
                {editingId === eq.id ? (
                  <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <input
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                    />
                    <input
                      type="text"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
                    />
                    <label className="flex items-center gap-2 text-[12px] text-gray-600">
                      <input
                        type="checkbox"
                        checked={formIsVent}
                        onChange={(e) => setFormIsVent(e.target.checked)}
                        className="rounded"
                      />
                      Vent 기록 대상
                    </label>
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
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
