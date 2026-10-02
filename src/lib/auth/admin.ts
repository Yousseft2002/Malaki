import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { env } from "@/lib/env";
import { SESSION_COOKIE, type SessionPayload, verifySession } from "./session";

export async function getAdminSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, env().ADMIN_SESSION_SECRET);
  // A session is only valid for the currently configured admin.
  if (!session || session.sub !== env().ADMIN_EMAIL?.toLowerCase()) return null;
  return session;
}

/** Call at the top of every admin page, server action and route handler. */
export async function requireAdmin(): Promise<SessionPayload> {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  return session;
}
