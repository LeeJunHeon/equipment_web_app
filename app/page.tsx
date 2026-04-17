"use client";

import { useState } from "react";
import type { PageId } from "@/lib/types";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleDetailClick(logId: number) {
    setSelectedLogId(logId);
    setShowDetailModal(true);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onEquipmentClick={() => setShowEquipmentModal(true)}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className="flex-1 overflow-y-auto p-5 md:p-6">
        {currentPage === "dashboard" && (
          <DashboardPage
            onNavigate={setCurrentPage}
            onRegisterClick={() => setShowRegisterModal(true)}
            onDetailClick={handleDetailClick}
          />
        )}
        {currentPage === "log" && (
          <LogPage
            onDetailClick={handleDetailClick}
            onRegisterClick={() => setShowRegisterModal(true)}
          />
        )}
        {currentPage === "repair" && (
          <RepairPage
            onDetailClick={handleDetailClick}
            onRegisterClick={() => setShowRegisterModal(true)}
          />
        )}
        {currentPage === "vent" && (
          <VentPage
            onDetailClick={handleDetailClick}
            onRegisterClick={() => setShowRegisterModal(true)}
          />
        )}
        {currentPage === "cleaning" && (
          <CleaningPage
            onDetailClick={handleDetailClick}
            onRegisterClick={() => setShowRegisterModal(true)}
          />
        )}
      </main>

      <LogRegisterModal isOpen={showRegisterModal} onClose={() => setShowRegisterModal(false)} />
      <LogDetailModal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} logId={selectedLogId} />
      <EquipmentModal isOpen={showEquipmentModal} onClose={() => setShowEquipmentModal(false)} />
    </div>
  );
}
