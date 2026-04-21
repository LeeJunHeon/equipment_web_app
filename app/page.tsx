"use client";

import { useState, useEffect, useCallback } from "react";
import type { Equipment, EquipmentLog } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DashboardPage from "@/components/DashboardPage";
import EquipmentDetailPage from "@/components/EquipmentDetailPage";
import EquipmentSettingsPage from "@/components/EquipmentSettingsPage";
import HistoryPage from "@/components/HistoryPage";
import LogRegisterModal from "@/components/modals/LogRegisterModal";
import LogDetailModal from "@/components/modals/LogDetailModal";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<"dashboard" | "equipment" | "equipment-settings" | "history-repair" | "history-vent" | "history-cleaning">("dashboard");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerDefaultType, setRegisterDefaultType] = useState<"repair" | "vent" | "cleaning">("repair");
  const [registerDefaultEquipmentId, setRegisterDefaultEquipmentId] = useState<number | undefined>(undefined);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [pmIssueCount, setPmIssueCount] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((d) => setIsAdmin(d.isAdmin ?? false))
      .catch(() => setIsAdmin(false));
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) setLogs(await res.json());
    } catch {
      setLogs([]);
    }
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (res.ok) {
        const d = await res.json();
        setPmIssueCount(d.pmIssueCount ?? 0);
      }
    } catch {
      setPmIssueCount(0);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchDashboard();
  }, [fetchLogs, fetchDashboard, refreshKey]);

  function handleDetailClick(logId: number) {
    setSelectedLogId(logId);
    setShowDetailModal(true);
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  function openRegisterModal(type: "repair" | "vent" | "cleaning", equipment: Equipment) {
    setRegisterDefaultType(type);
    setRegisterDefaultEquipmentId(equipment.id);
    setShowRegisterModal(true);
  }

  const unresolvedCount = logs.filter(
    (l) => l.eventType === "repair" && l.status === "처리중"
  ).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        selectedEquipmentId={selectedEquipment?.id ?? null}
        onNavigateDashboard={() => {
          setCurrentPage("dashboard");
          setSelectedEquipment(null);
        }}
        onNavigateEquipment={(eq) => {
          setCurrentPage("equipment");
          setSelectedEquipment(eq);
        }}
        onEquipmentSettingClick={() => { setCurrentPage("equipment-settings"); setSelectedEquipment(null); }}
        onNavigateHistory={(type) => { setCurrentPage(`history-${type}` as "history-repair" | "history-vent" | "history-cleaning"); setSelectedEquipment(null); }}
        isAdmin={isAdmin}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentPage={currentPage}
          equipmentName={selectedEquipment?.name}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          unresolvedCount={unresolvedCount}
          pmIssueCount={pmIssueCount}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {currentPage === "dashboard" && (
            <DashboardPage
              onNavigateEquipment={(eq) => {
                setCurrentPage("equipment");
                setSelectedEquipment(eq);
              }}
              onDetailClick={handleDetailClick}
              onRegisterLog={openRegisterModal}
              refreshKey={refreshKey}
            />
          )}
          {currentPage === "equipment" && selectedEquipment && (
            <EquipmentDetailPage
              equipment={selectedEquipment}
              onRegisterRepair={() => openRegisterModal("repair", selectedEquipment)}
              onRegisterVent={() => openRegisterModal("vent", selectedEquipment)}
              onRegisterCleaning={() => openRegisterModal("cleaning", selectedEquipment)}
              onDetailClick={handleDetailClick}
              refreshKey={refreshKey}
            />
          )}
          {currentPage === "equipment-settings" && (
            <EquipmentSettingsPage isAdmin={isAdmin} />
          )}
          {(currentPage === "history-repair" || currentPage === "history-vent" || currentPage === "history-cleaning") && (
            <HistoryPage
              eventType={currentPage.replace("history-", "") as "repair" | "vent" | "cleaning"}
              refreshKey={refreshKey}
              onRefresh={handleRefresh}
              isAdmin={isAdmin}
            />
          )}
        </main>
      </div>

      <LogRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSave={handleRefresh}
        defaultEventType={registerDefaultType}
        defaultEquipmentId={registerDefaultEquipmentId}
      />
      <LogDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onSave={handleRefresh}
        logId={selectedLogId}
        logs={logs}
        isAdmin={isAdmin}
      />
    </div>
  );
}
