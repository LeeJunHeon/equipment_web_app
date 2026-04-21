"use client";

import { useState, useEffect } from "react";
import { X, Camera, FileText, Send } from "lucide-react";
import PhotoUploader from "@/components/ui/PhotoUploader";
import VoiceInput from "@/components/ui/VoiceInput";

interface RepairEntryModalProps {
  isOpen: boolean;
  logId: number;
  onClose: () => void;
  onSave: () => void;
}

export default function RepairEntryModal({
  isOpen,
  logId,
  onClose,
  onSave,
}: RepairEntryModalProps) {
  const [mode, setMode] = useState<"memo" | "photo" | "both">("both");
  const [memo, setMemo] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setMemo("");
      setSelectedFiles([]);
      setMode("both");
      setError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSave() {
    // 유효성 검사
    if (mode === "memo" && !memo.trim()) {
      setError("메모를 입력해주세요.");
      return;
    }
    if (mode === "photo" && selectedFiles.length === 0) {
      setError("사진을 선택해주세요.");
      return;
    }
    if (mode === "both" && !memo.trim() && selectedFiles.length === 0) {
      setError("메모 또는 사진 중 하나는 입력해주세요.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      // 1. 일일 기록 생성
      const res = await fetch(`/api/logs/${logId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memo: memo.trim() || null,
          occurredAt: new Date().toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "저장에 실패했습니다.");
        return;
      }

      const entry = await res.json();

      // 2. 사진 업로드
      for (const file of selectedFiles) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("entryId", String(entry.id));
        await fetch("/api/upload-entry", { method: "POST", body: fd });
      }

      // 초기화 후 닫기
      setMemo("");
      setSelectedFiles([]);
      setMode("both");
      onSave();
      onClose();
    } catch {
      setError("저장 중 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  function handleClose() {
    setMemo("");
    setSelectedFiles([]);
    setMode("both");
    setError("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40"
      onClick={handleClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[14px] font-bold text-gray-900">오늘 기록 추가</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* 입력 모드 선택 */}
        <div className="px-5 pt-4">
          <div className="flex gap-2">
            {[
              { key: "both", label: "메모 + 사진", icon: null },
              { key: "memo", label: "메모만", icon: FileText },
              { key: "photo", label: "사진만", icon: Camera },
            ].map((m) => (
              <button
                key={m.key}
                onClick={() => setMode(m.key as typeof mode)}
                className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium border transition-colors ${
                  mode === m.key
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* 입력 영역 */}
        <div className="px-5 py-4 space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">
              {error}
            </div>
          )}

          {(mode === "memo" || mode === "both") && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] font-semibold text-gray-500">메모</label>
                <VoiceInput
                  onResult={(text) => setMemo((prev) => prev ? prev + " " + text : text)}
                  disabled={saving}
                />
              </div>
              <textarea
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={3}
                placeholder="오늘 진행한 내용을 간단히 기록하세요..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-[12px] outline-none focus:border-blue-400 resize-none"
                autoFocus
              />
            </div>
          )}

          {(mode === "photo" || mode === "both") && (
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold text-gray-500">
                사진
              </label>
              <PhotoUploader
                onFilesChange={setSelectedFiles}
                maxFiles={10}
                disabled={saving}
              />
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-100">
          <button
            onClick={handleClose}
            disabled={saving}
            className="rounded-lg border border-gray-200 px-4 py-2 text-[12px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-[12px] font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Send size={12} />
            {saving ? "저장 중..." : "저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
