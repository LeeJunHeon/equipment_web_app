"use client";

import { useState, useEffect } from "react";
import type { PageId, EquipmentLog } from "@/lib/types";
import { LOGS } from "@/lib/mockData";
import Sidebar from "@/components/Sidebar";
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
  const [logs, setLogs] = useState<EquipmentLog[]>(LOGS);

  useEffect(() => {
    if (window.innerWidth < 768) setSidebarOpen(false);
  }, []);

  function handleDetailClick(logId: number) {
    setSelectedLogId(logId);
    setShowDetailModal(true);
  }

  function handleSave(newLog: Omit<EquipmentLog, "id">) {
    setLogs((prev) => [...prev, { ...newLog, id: prev.length + 1 }]);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onEquipmentClick={() => setShowEquipmentModal(true)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        logs={logs}
      />
      <main className="flex-1 overflow-y-auto p-5 md:p-6">
        {currentPage === "dashboard" && (
          <DashboardPage
            onNavigate={setCurrentPage}
            onRegisterClick={() => setShowRegisterModal(true)}
            onDetailClick={handleDetailClick}
            logs={logs}
          />
        )}
        {currentPage === "log" && (
          <LogPage
            onDetailClick={handleDetailClick}
            onRegisterClick={() => setShowRegisterModal(true)}
            logs={logs}
          />
        )}
        {currentPage === "repair" && (
          <RepairPage
            onDetailClick={handleDetailClick}
            onRegisterClick={() => setShowRegisterModal(true)}
            logs={logs}
          />
        )}
        {currentPage === "vent" && (
          <VentPage
            onDetailClick={handleDetailClick}
            onRegisterClick={() => setShowRegisterModal(true)}
            logs={logs}
          />
        )}
        {currentPage === "cleaning" && (
          <CleaningPage
            onDetailClick={handleDetailClick}
            onRegisterClick={() => setShowRegisterModal(true)}
            logs={logs}
          />
        )}
      </main>

      <LogRegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSave={handleSave}
      />
      <LogDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        logId={selectedLogId}
        logs={logs}
      />
      <EquipmentModal isOpen={showEquipmentModal} onClose={() => setShowEquipmentModal(false)} />
    </div>
  );
}
