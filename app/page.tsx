"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Equipment, EquipmentLog } from "@/lib/types";
import { canAccessPage, DEFAULT_PAGE, type PageKey } from "@/lib/menus";
import { readPageLink, sendLauncherUsage, writePageLink, type PageLink } from "@/lib/launcher";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { REPAIR_STATUS } from "@/lib/repairStatus";
import DashboardPage from "@/components/DashboardPage";
import EquipmentDetailPage from "@/components/EquipmentDetailPage";
import EquipmentSettingsPage from "@/components/EquipmentSettingsPage";
import HistoryPage from "@/components/HistoryPage";
import LogRegisterModal from "@/components/modals/LogRegisterModal";
import LogDetailModal from "@/components/modals/LogDetailModal";

/**
 * 딥링크(?page=·&id=)가 가리키는 화면을 실제로 열 수 있는지 확인한다.
 * 권한이 없거나 장비를 못 찾으면(비활성·삭제) null → 기본 화면 그대로.
 */
async function resolvePageLink(
  link: PageLink,
  isAdmin: boolean,
): Promise<{ page: PageKey; equipment: Equipment | null } | null> {
  if (!canAccessPage(link.page, isAdmin)) return null;
  if (link.page !== "equipment") return { page: link.page, equipment: null };

  // 사이드바와 같은 목록(활성 장비)에서 찾아야 화면에 보이는 장비와 어긋나지 않는다.
  const res = await fetch("/api/equipment");
  if (!res.ok) return null;
  const list: Equipment[] = await res.json();
  const equipment = list.find((eq) => eq.id === link.id);
  return equipment ? { page: "equipment", equipment } : null;
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<PageKey>(DEFAULT_PAGE);
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
  const [pmIssueDetails, setPmIssueDetails] = useState<{ name: string; issues: string[] }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  // 딥링크 확인(권한·장비 조회)이 끝나기 전에 주소 동기화가 ?page= 를 지워 버리지 않게 막는다.
  const linkPendingRef = useRef(true);
  // 딥링크 확인 중에 사용자가 먼저 메뉴를 옮겼다면 그 선택이 우선이다.
  const userNavigatedRef = useRef(false);

  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
      setIsDesktop(false);
    }
  }, []);

  useEffect(() => {
    // 주소는 마운트 후에만 읽는다(서버 렌더와 첫 화면을 같게 유지).
    const link = readPageLink();
    fetch("/api/me")
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((d) => d.isAdmin ?? false)
      .catch(() => false)
      .then(async (admin: boolean) => {
        setIsAdmin(admin);
        // 관리자 전용 화면은 /api/me 로 관리자임을 확인한 뒤에만 연다.
        const target = link ? await resolvePageLink(link, admin).catch(() => null) : null;
        if (userNavigatedRef.current) return;
        linkPendingRef.current = false;
        if (target) {
          // 처음 열린 화면은 포털 런처가 따로 세므로 사용 기록을 보내지 않는다.
          setCurrentPage(target.page);
          setSelectedEquipment(target.equipment);
        } else {
          // 모르는 키·권한 없음·없는 장비 → 기본 화면 그대로 두고 주소만 정리
          writePageLink(DEFAULT_PAGE, null);
        }
      });
  }, []);

  // 화면이 바뀔 때마다 주소의 page·id 를 맞춘다(새로고침·공유 시 같은 화면).
  useEffect(() => {
    if (linkPendingRef.current) return;
    writePageLink(currentPage, selectedEquipment?.id ?? null);
  }, [currentPage, selectedEquipment]);

  /**
   * 사용자 조작으로 화면을 옮기는 유일한 진입점. 포털 사용 기록은 여기서만 보낸다.
   * 이미 열린 같은 메뉴(같은 장비)를 다시 누른 경우는 기록하지 않는다.
   */
  function navigate(page: PageKey, equipment: Equipment | null = null) {
    const isSameMenu =
      page === currentPage && (page !== "equipment" || equipment?.id === selectedEquipment?.id);
    userNavigatedRef.current = true;
    if (linkPendingRef.current) {
      // 딥링크 확인 중이면 상태가 안 바뀌어 동기화 effect 가 안 돌 수 있으므로 직접 맞춘다.
      linkPendingRef.current = false;
      writePageLink(page, equipment?.id ?? null);
    }
    setCurrentPage(page);
    setSelectedEquipment(equipment);
    if (!isSameMenu) sendLauncherUsage(page, equipment?.id ?? null);
  }

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
        const details = (d.equipments ?? [])
          .filter((e: { ventStatus: string; cleaningStatus: string }) =>
            e.ventStatus !== "normal" || e.cleaningStatus !== "normal"
          )
          .map((e: { name: string; isVentTarget: boolean; isCleaningTarget?: boolean; ventStatus: string; cleaningStatus: string }) => {
            const issues: string[] = [];
            if (e.isVentTarget && e.ventStatus === "overdue") issues.push("Vent 필요");
            else if (e.isVentTarget && e.ventStatus === "caution") issues.push("Vent 임박");
            if (e.isCleaningTarget !== false && e.cleaningStatus === "overdue") issues.push("클리닝 필요");
            else if (e.isCleaningTarget !== false && e.cleaningStatus === "caution") issues.push("클리닝 임박");
            return { name: e.name, issues };
          });
        setPmIssueDetails(details);
      }
    } catch {
      setPmIssueCount(0);
      setPmIssueDetails([]);
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

  const inProgressLogs = logs.filter(
    (l) => l.eventType === "repair" && l.status === REPAIR_STATUS.STOPPED
  );
  const needsRepairLogs = logs.filter(
    (l) => l.eventType === "repair" && l.status === REPAIR_STATUS.RUNNING
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        currentPage={currentPage}
        selectedEquipmentId={selectedEquipment?.id ?? null}
        onNavigateDashboard={() => navigate("dashboard")}
        onNavigateEquipment={(eq) => navigate("equipment", eq)}
        onEquipmentSettingClick={() => navigate("equipment-settings")}
        onNavigateHistory={(type) => navigate(`history-${type}`)}
        isAdmin={isAdmin}
        isDesktop={isDesktop}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentPage={currentPage}
          equipmentName={selectedEquipment?.name}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          unresolvedCount={inProgressLogs.length}
          unresolvedDetails={inProgressLogs.map((l) => ({ equipmentName: l.equipmentName, symptom: l.symptom ?? "" }))}
          needsRepairCount={needsRepairLogs.length}
          needsRepairDetails={needsRepairLogs.map((l) => ({ equipmentName: l.equipmentName, symptom: l.symptom ?? "" }))}
          pmIssueCount={pmIssueCount}
          pmIssueDetails={pmIssueDetails}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {currentPage === "dashboard" && (
            <DashboardPage
              onNavigateEquipment={(eq) => navigate("equipment", eq)}
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
