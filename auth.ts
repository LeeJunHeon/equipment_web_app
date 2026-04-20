import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

// 장비관리 앱은 Prisma 없이 authConfig만 사용
// (재고관리처럼 DB signIn 콜백 불필요 — 포털에서 이미 검증됨)
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
