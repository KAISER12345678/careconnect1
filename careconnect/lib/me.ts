import { verifySession } from "@/lib/auth";

export async function getMe() {
  return verifySession();
}
