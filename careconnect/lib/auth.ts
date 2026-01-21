import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

const COOKIE_NAME = "cc_session";

export type SessionUser = {
  id: string;
  email: string;
  role: UserRole;
  name: string;
};

export function signSession(user: SessionUser): string {
  const secret = process.env.AUTH_JWT_SECRET;
  if (!secret) throw new Error("Missing AUTH_JWT_SECRET");
  return jwt.sign(user, secret, { expiresIn: "14d" });
}

export function setSessionCookie(token: string) {
  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 14 * 24 * 60 * 60,
  });
}

export function clearSessionCookie() {
  cookies().set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export function getSessionToken(): string | null {
  return cookies().get(COOKIE_NAME)?.value ?? null;
}

export function verifySession(): SessionUser | null {
  const token = getSessionToken();
  if (!token) return null;
  try {
    const secret = process.env.AUTH_JWT_SECRET;
    if (!secret) throw new Error("Missing AUTH_JWT_SECRET");
    return jwt.verify(token, secret) as SessionUser;
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = verifySession();
  if (!session) return null;
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return null;
  return { ...session };
}

export function requireRole(session: SessionUser | null, roles: UserRole[]) {
  if (!session) return false;
  return roles.includes(session.role);
}
