// lib/equipmentLogNotify.ts
// 새 장비 이력이 등록됐을 때 구글챗 알림 대상인지 판정하고 발송한다.
// 이력 저장 API 응답이 나간 뒤(after) 호출되므로, 여기서의 실패·지연이
// 이력 저장 결과에 영향을 주면 안 된다 → 절대 throw 하지 않는다.

import { prisma } from "@/lib/prisma";
import { sendGoogleChatText } from "@/lib/googleChat";
import { buildEquipmentLogMessage } from "@/lib/equipmentLogMessage";

// 웹훅 미설정 경고는 이력 등록마다 찍히면 로그가 오염되므로 프로세스당 1회만.
let warnedMissingWebhook = false;

/**
 * 새로 생성된 이력 1건에 대해 구글챗 알림을 보낸다.
 * 웹훅 미설정·이력 없음·장비 알림 꺼짐이면 조용히 종료한다.
 * 실패는 console.error 로만 남기고 절대 throw 하지 않는다.
 * @param logId 방금 생성된 equipment_logs.id
 */
export async function notifyNewEquipmentLog(logId: number): Promise<void> {
  try {
    const webhookUrl = process.env.EQUIP_CHAT_WEBHOOK_URL?.trim();
    if (!webhookUrl) {
      if (!warnedMissingWebhook) {
        warnedMissingWebhook = true;
        console.warn("[chatNotify] EQUIP_CHAT_WEBHOOK_URL 미설정 — 구글챗 알림을 보내지 않습니다.");
      }
      return;
    }

    const log = await prisma.equipmentLog.findUnique({
      where: { id: logId },
      include: { equipment: { select: { name: true, chatNotify: true } } },
    });
    if (!log || !log.equipment.chatNotify) return;

    const text = buildEquipmentLogMessage({ ...log, equipmentName: log.equipment.name });
    await sendGoogleChatText(webhookUrl, text);

    // 담당자 이름 등 개인정보와 웹훅 URL 은 남기지 않는다.
    console.log(`[chatNotify] 발송 완료 log=${log.id} equipment=${log.equipmentId}`);
  } catch (error) {
    console.error(
      "[chatNotify] 알림 발송 실패 (이력 저장은 정상):",
      error instanceof Error ? error.message : String(error),
    );
  }
}
