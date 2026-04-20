import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// Edge Runtime용 설정 (Prisma 없음)
// 장비관리 앱은 DB 조회 없이 쿠키만 검증
// 사용자 검증(DB 등록 여부)은 재고관리 앱에서 담당
export const authConfig: NextAuthConfig = {
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  pages: {
    // 미인증 접근 시 포털 로그인으로 이동
    signIn: "https://vanam.synology.me/login",
  },
  // SSO 핵심: 포털/재고관리와 동일한 쿠키 이름+도메인
  // 이 설정이 없으면 포털에서 발급한 쿠키를 읽을 수 없음
  cookies: {
    sessionToken: {
      name: "__Secure-authjs.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax" as const,
        path: "/",
        secure: true,
        domain: ".vanam.synology.me",
      },
    },
  },
};
