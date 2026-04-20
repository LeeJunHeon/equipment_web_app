"use client";

import { useState, useEffect, useCallback } from "react";
import type { PageId, EquipmentLog } from "@/lib/types";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import DashboardPage from "@/components/DashboardPage";
import LogPage from "@/components/LogPage";
import RepairPage from "@/components/RepairPage";
import VentPage from "@/components/VentPage";
import CleaningPage from "@/components/CleaningPage";
import LogRegisterModal from "@/components/modals/LogRegisterModal";
import LogDetailModal from "@/components/modals/LogDetailModal";
import EquipmentModal from "@/components/modals/EquipmentModal";

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageId>("dashboard");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [logs, setLogs] = useState<EquipmentLog[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // 재고관리 앱과 동일: 1024px(lg) 미만이면 사이드바 닫힘
  useEffect(() => {
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch("/api/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([]);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs, refreshKey]);

  function handleDetailClick(logId: number) {
    setSelectedLogId(logId);
    setShowDetailModal(true);
  }

  function handleRefresh() {
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onEquipmentClick={() => setShowEquipmentModal(true)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        logs={logs}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentPage={currentPage}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onRegisterClick={() => setShowRegisterModal(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {currentPage === "dashboard" && (
            <DashboardPage
              onNavigate={setCurrentPage}
              onDetailClick={handleDetailClick}
              refreshKey={refreshKey}
            />
          )}
          {currentPage === "log" && (
            <LogPage
              onDetailClick={handleDetailClick}
              onRegisterClick={() => setShowRegisterModal(true)}
              refreshKey={refreshKey}
            />
          )}
          {currentPage === "repair" && (
            <RepairPage
              onDetailClick={handleDetailClick}
              onRegisterClick={() => setShowRegisterModal(true)}
              refreshKey={refreshKey}
            />
          )}
          {currentPage === "vent" && (
            <VentPage
              onDetailClick={handleDetailClick}
              onRegisterClick={() => setShowRegisterModal(true)}
              refreshKey={refreshKey}
            />
          )}
          {currentPage === "cleaning" && (
            <CleaningPage
              onDetailClick={handleDetailClick}
              onRegisterClick={() => setShowRegisterModal(true)}
              refreshKey={refreshKey}
            />
          )}
        </main>
      </div>

      <LogRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSave={handleRefresh}
      />
      <LogDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        onSave={() => setRefreshKey((k) => k + 1)}
        logId={selectedLogId}
        logs={logs}
      />
      <EquipmentModal
        isOpen={showEquipmentModal}
        onClose={() => {
          setShowEquipmentModal(false);
          handleRefresh();
        }}
      />
    </div>
  );
}
