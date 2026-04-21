"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, Check, X, Wind, Sparkles } from "lucide-react";
import type { Equipment } from "@/lib/types";

export default function EquipmentSettingsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // 폼 state
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [formIsVent, setFormIsVent] = useState(false);
  const [formIsCleaning, setFormIsCleaning] = useState(true);
  const [formVentInterval, setFormVentInterval] = useState(30);
  const [formCleaningInterval, setFormCleaningInterval] = useState(14);

  const [ventOptions, setVentOptions] = useState<{ id: number; label: string }[]>([]);
  const [cleaningOptions, setCleaningOptions] = useState<{ id: number; label: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [newVentLabel, setNewVentLabel] = useState("");
  const [newCleaningLabel, setNewCleaningLabel] = useState("");
  const [savingVent, setSavingVent] = useState(false);
  const [savingCleaning, setSavingCleaning] = useState(false);

  useEffect(() => {
    fetchEquipments();
    fetchOptions();
  }, []);

  async function fetchEquipments() {
    setLoading(true);
    try {
      const res = await fetch("/api/equipment");
      if (res.ok) setEquipments(await res.json());
    } catch {
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchOptions() {
    setOptionsLoading(true);
    try {
      const res = await fetch("/api/log-options");
      if (res.ok) {
        const data = await res.json();
        setVentOptions(data.ventReasons);
        setCleaningOptions(data.cleaningTypes);
      }
    } catch {
      setVentOptions([]);
      setCleaningOptions([]);
    } finally {
      setOptionsLoading(false);
    }
  }

  async function addVentOption() {
    if (!newVentLabel.trim() || savingVent) return;
    setSavingVent(true);
    try {
      const res = await fetch("/api/log-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vent", label: newVentLabel.trim() }),
      });
      if (res.ok) {
        const newOpt = await res.json();
        setVentOptions((prev) => [...prev, newOpt]);
        setNewVentLabel("");
      }
    } finally {
      setSavingVent(false);
    }
  }

  async function deleteVentOption(id: number) {
    if (!confirm("이 사유를 삭제하시겠습니까?")) return;
    try {
      await fetch("/api/log-options", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "vent", id }),
      });
      setVentOptions((prev) => prev.filter((o) => o.id !== id));
    } catch {}
  }

  async function addCleaningOption() {
    if (!newCleaningLabel.trim() || savingCleaning) return;
    setSavingCleaning(true);
    try {
      const res = await fetch("/api/log-options", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cleaning", label: newCleaningLabel.trim() }),
      });
      if (res.ok) {
        const newOpt = await res.json();
        setCleaningOptions((prev) => [...prev, newOpt]);
        setNewCleaningLabel("");
      }
    } finally {
      setSavingCleaning(false);
    }
  }

  async function deleteCleaningOption(id: number) {
    if (!confirm("이 유형을 삭제하시겠습니까?")) return;
    try {
      await fetch("/api/log-options", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "cleaning", id }),
      });
      setCleaningOptions((prev) => prev.filter((o) => o.id !== id));
    } catch {}
  }

  function startAdd() {
    setIsAdding(true);
    setEditingId(null);
    setFormName("");
    setFormCategory("");
    setFormIsVent(false);
    setFormIsCleaning(true);
    setFormVentInterval(30);
    setFormCleaningInterval(14);
  }

  function startEdit(eq: Equipment) {
    setEditingId(eq.id);
    setIsAdding(false);
    setFormName(eq.name);
    setFormCategory(eq.category || "");
    setFormIsVent(eq.isVentTarget);
    setFormIsCleaning(eq.isCleaningTarget ?? true);
    setFormVentInterval(eq.ventIntervalDays ?? 30);
    setFormCleaningInterval(eq.cleaningIntervalDays ?? 14);
  }

  function cancelEdit() {
    setEditingId(null);
    setIsAdding(false);
    setFormName("");
    setFormCategory("");
    setFormIsVent(false);
    setFormIsCleaning(true);
    setFormVentInterval(30);
    setFormCleaningInterval(14);
  }

  async function saveEdit() {
    if (!formName.trim()) return;
    const body = {
      name: formName,
      category: formCategory,
      isVentTarget: formIsVent,
      isCleaningTarget: formIsCleaning,
      ventIntervalDays: formVentInterval,
      cleaningIntervalDays: formCleaningInterval,
    };
    try {
      if (isAdding) {
        const res = await fetch("/api/equipment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) return;
      } else if (editingId !== null) {
        const res = await fetch("/api/equipment", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...body }),
        });
        if (!res.ok) return;
      }
      cancelEdit();
      await fetchEquipments();
    } catch {
      /* noop */
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
    } catch {
      /* noop */
    }
  }

  const FormRow = ({ compact = false }: { compact?: boolean }) => (
    <div className={`space-y-3 rounded-xl border border-blue-200 bg-blue-50 p-4 ${compact ? "" : "mb-4"}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">장비명 *</label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="장비명을 입력하세요"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-blue-400"
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">카테고리</label>
          <input
            type="text"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            placeholder="예: CVD, PVD"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={formIsVent}
            onChange={(e) => setFormIsVent(e.target.checked)}
            className="rounded"
          />
          <Wind size={13} className="text-blue-500" />
          Vent 기록 대상
        </label>
        <label className="flex items-center gap-2 text-[13px] text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={formIsCleaning}
            onChange={(e) => setFormIsCleaning(e.target.checked)}
            className="rounded"
          />
          <Sparkles size={13} className="text-green-500" />
          클리닝 기록 대상
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
            <Wind size={10} className="inline mr-1 text-blue-400" />
            Vent 주기 (일)
          </label>
          <input
            type="number"
            min={1}
            value={formVentInterval}
            onChange={(e) => setFormVentInterval(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-blue-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-semibold text-gray-500">
            <Sparkles size={10} className="inline mr-1 text-green-400" />
            클리닝 주기 (일)
          </label>
          <input
            type="number"
            min={1}
            value={formCleaningInterval}
            onChange={(e) => setFormCleaningInterval(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-[13px] outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button
          onClick={cancelEdit}
          className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-50"
        >
          <X size={13} /> 취소
        </button>
        <button
          onClick={saveEdit}
          disabled={!formName.trim()}
          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          <Check size={13} /> 저장
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[15px] font-bold text-gray-900">장비 설정</h2>
          <p className="text-[12px] text-gray-400 mt-0.5">장비 목록과 PM 주기를 관리합니다.</p>
        </div>
        <button
          onClick={startAdd}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus size={15} />
          장비 추가
        </button>
      </div>

      {/* 장비 추가 폼 */}
      {isAdding && <FormRow />}

      {/* 로딩 */}
      {loading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* 장비 없음 */}
      {!loading && equipments.length === 0 && !isAdding && (
        <div className="py-16 text-center text-gray-400 text-[13px]">
          등록된 장비가 없습니다. 장비를 추가해주세요.
        </div>
      )}

      {/* 데스크탑: 테이블 */}
      {!loading && equipments.length > 0 && (
        <>
          {/* 테이블 — sm 이상에서만 표시 */}
          <div className="hidden sm:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-500">장비명</th>
                  <th className="px-4 py-3 font-semibold text-gray-500">카테고리</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-center">Vent</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-center">클리닝</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-center">Vent 주기</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-center">클리닝 주기</th>
                  <th className="px-4 py-3 font-semibold text-gray-500 text-right">액션</th>
                </tr>
              </thead>
              <tbody>
                {equipments.map((eq) => (
                  <>
                    <tr key={eq.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-900">{eq.name}</td>
                      <td className="px-4 py-3 text-gray-500">{eq.category ?? "—"}</td>
                      <td className="px-4 py-3 text-center">
                        {eq.isVentTarget
                          ? <span className="inline-block rounded-full bg-blue-100 text-blue-700 text-[10px] font-medium px-2 py-0.5">대상</span>
                          : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {eq.isCleaningTarget !== false
                          ? <span className="inline-block rounded-full bg-green-100 text-green-700 text-[10px] font-medium px-2 py-0.5">대상</span>
                          : <span className="inline-block rounded-full bg-gray-100 text-gray-500 text-[10px] font-medium px-2 py-0.5">제외</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{eq.ventIntervalDays ?? 30}일</td>
                      <td className="px-4 py-3 text-center text-gray-600">{eq.cleaningIntervalDays ?? 14}일</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => editingId === eq.id ? cancelEdit() : startEdit(eq)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => deleteEquipment(eq.id)}
                            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {editingId === eq.id && (
                      <tr key={`edit-${eq.id}`}>
                        <td colSpan={7} className="px-4 py-3 bg-blue-50/50">
                          <FormRow compact />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          {/* 모바일: 카드 */}
          <div className="sm:hidden space-y-3">
            {equipments.map((eq) => (
              <div key={eq.id}>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">{eq.name}</p>
                      <p className="text-[11px] text-gray-400">{eq.category ?? "미분류"}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => editingId === eq.id ? cancelEdit() : startEdit(eq)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteEquipment(eq.id)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {eq.isVentTarget && (
                      <span className="flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 font-medium">
                        <Wind size={10} /> Vent 대상 · {eq.ventIntervalDays ?? 30}일 주기
                      </span>
                    )}
                    {eq.isCleaningTarget !== false ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 font-medium">
                        <Sparkles size={10} /> 클리닝 대상 · {eq.cleaningIntervalDays ?? 14}일 주기
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 font-medium">
                        <Sparkles size={10} /> 클리닝 제외
                      </span>
                    )}
                  </div>
                </div>
                {editingId === eq.id && <div className="mt-2"><FormRow compact /></div>}
              </div>
            ))}
          </div>
        </>
      )}
      {/* ── Vent 사유 / 클리닝 유형 관리 ── */}
      <div className="border-t border-gray-100 pt-5 space-y-5">

        {/* Vent 사유 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Wind size={15} className="text-blue-500" />
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">Vent 사유 관리</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">이력 등록 시 표시될 Vent 사유 목록</p>
            </div>
          </div>
          {optionsLoading ? (
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {ventOptions.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`flex items-center justify-between px-4 py-2.5 text-[13px] ${
                    idx !== ventOptions.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <span className="text-gray-800">{opt.label}</span>
                  <button
                    onClick={() => deleteVentOption(opt.id)}
                    className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {ventOptions.length === 0 && (
                <div className="py-6 text-center text-[12px] text-gray-400">등록된 사유가 없습니다.</div>
              )}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newVentLabel}
              onChange={(e) => setNewVentLabel(e.target.value)}
              placeholder="새 사유 이름 입력"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
              onKeyDown={(e) => { if (e.key === "Enter") addVentOption(); }}
            />
            <button
              onClick={addVentOption}
              disabled={!newVentLabel.trim() || savingVent}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus size={13} /> 추가
            </button>
          </div>
        </div>

        {/* 클리닝 유형 */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={15} className="text-green-500" />
            <div>
              <h2 className="text-[15px] font-bold text-gray-900">클리닝 유형 관리</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">이력 등록 시 표시될 클리닝 유형 목록</p>
            </div>
          </div>
          {optionsLoading ? (
            <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {cleaningOptions.map((opt, idx) => (
                <div
                  key={opt.id}
                  className={`flex items-center justify-between px-4 py-2.5 text-[13px] ${
                    idx !== cleaningOptions.length - 1 ? "border-b border-gray-50" : ""
                  }`}
                >
                  <span className="text-gray-800">{opt.label}</span>
                  <button
                    onClick={() => deleteCleaningOption(opt.id)}
                    className="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
              {cleaningOptions.length === 0 && (
                <div className="py-6 text-center text-[12px] text-gray-400">등록된 유형이 없습니다.</div>
              )}
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCleaningLabel}
              onChange={(e) => setNewCleaningLabel(e.target.value)}
              placeholder="새 유형 이름 입력"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400"
              onKeyDown={(e) => { if (e.key === "Enter") addCleaningOption(); }}
            />
            <button
              onClick={addCleaningOption}
              disabled={!newCleaningLabel.trim() || savingCleaning}
              className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-[12px] font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              <Plus size={13} /> 추가
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
