import { prisma } from "@/lib/db/prisma"
import type { AuditAction, AuditTargetType } from "@prisma/client"

export const CRITICAL_ACTIONS: ReadonlySet<AuditAction> = new Set([
  "USER_ROLE_CHANGE",
  "USER_BAN",
  "USER_UNBAN",
  "USER_DELETE",
  "COORDINATOR_ASSIGN",
  "SLOT_ADMIN_CANCEL",
] as AuditAction[])

export type AuditLevel = "error" | "warn" | "info" | "debug"

export const ACTION_LEVEL: Record<AuditAction, AuditLevel> = {
  USER_ROLE_CHANGE: "warn",
  USER_BAN: "error",
  USER_UNBAN: "warn",
  USER_DELETE: "error",
  COORDINATOR_ASSIGN: "warn",
  SLOT_BOOK: "info",
  SLOT_CANCEL: "info",
  SLOT_ASSIGN: "info",
  SLOT_ADMIN_CANCEL: "error",
  SLOT_ADMIN_BOOK: "info",
  BOOKING_CONFIG_CHANGE: "warn",
  MEETING_LINK_UPSERT: "info",
  MEETING_LINK_DELETE: "warn",
  SLOTS_GENERATE: "debug",
  EVENT_CREATE: "info",
  EVENT_DELETE: "warn",
  POST_HIDE: "warn",
  POST_UNHIDE: "info",
  COMMENT_HIDE: "warn",
  REPORT_RESOLVE: "info",
  BROADCAST_CREATE: "info",
  GROUP_CREATE: "info",
  GROUP_DELETE: "warn",
  GROUP_MEMBER_ROLE_CHANGE: "info",
  PROFILE_UPDATE: "debug",
  AUTH_LOGIN_SUCCESS: "info",
  AUTH_LOGIN_FAILURE: "warn",
  AUTH_LOGOUT: "info",
  AUTH_PASSWORD_CHANGE: "warn",
}

const ACTION_SERVICE: Record<AuditAction, string> = {
  USER_ROLE_CHANGE: "admin",
  USER_BAN: "admin",
  USER_UNBAN: "admin",
  USER_DELETE: "admin",
  COORDINATOR_ASSIGN: "admin",
  SLOT_BOOK: "booking",
  SLOT_CANCEL: "booking",
  SLOT_ASSIGN: "booking",
  SLOT_ADMIN_CANCEL: "booking",
  SLOT_ADMIN_BOOK: "booking",
  BOOKING_CONFIG_CHANGE: "booking",
  MEETING_LINK_UPSERT: "booking",
  MEETING_LINK_DELETE: "booking",
  SLOTS_GENERATE: "booking",
  EVENT_CREATE: "booking",
  EVENT_DELETE: "booking",
  POST_HIDE: "moderation",
  POST_UNHIDE: "moderation",
  COMMENT_HIDE: "moderation",
  REPORT_RESOLVE: "moderation",
  BROADCAST_CREATE: "moderation",
  GROUP_CREATE: "groups",
  GROUP_DELETE: "groups",
  GROUP_MEMBER_ROLE_CHANGE: "groups",
  PROFILE_UPDATE: "auth",
  AUTH_LOGIN_SUCCESS: "auth",
  AUTH_LOGIN_FAILURE: "auth",
  AUTH_LOGOUT: "auth",
  AUTH_PASSWORD_CHANGE: "auth",
}

export function getAuditLevel(action: AuditAction): AuditLevel {
  return ACTION_LEVEL[action] ?? "info"
}

export function getAuditService(action: AuditAction): string {
  return ACTION_SERVICE[action] ?? "app"
}

export interface LogAuditParams {
  actorId: string
  actorRole?: string | null
  action: AuditAction
  targetType: AuditTargetType
  targetId: string
  metadata?: Record<string, unknown>
  ip?: string | null
  userAgent?: string | null
}

function buildExpiresAt(action: AuditAction): Date | null {
  if (CRITICAL_ACTIONS.has(action)) return null
  if (action === "SLOT_BOOK" || action === "SLOT_CANCEL") {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d
  }
  const d = new Date()
  d.setDate(d.getDate() + 90)
  return d
}

export async function logAudit(params: LogAuditParams): Promise<void> {
  const { actorId, actorRole, action, targetType, targetId, metadata, ip, userAgent } = params
  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        actorRole: actorRole ?? null,
        action,
        targetType,
        targetId,
        metadata: (metadata as unknown as never) ?? undefined,
        ip: ip ?? null,
        userAgent: userAgent ?? null,
        expiresAt: buildExpiresAt(action),
      },
    })
  } catch (e) {
    console.error("[AUDIT] failed to write log", e instanceof Error ? e.message : String(e), { action, targetId })
  }
}

export function extractRequestContext(req: Request): { ip: string | null; userAgent: string | null } {
  const hf = (req.headers as unknown as { get?: (k: string) => string | null })?.get?.bind(req.headers) as ((k: string) => string | null) | undefined
  const get = (k: string) => {
    if (hf) return hf(k)
    const h = req.headers as unknown as Record<string, string | undefined>
    return h[k] ?? h[k.toLowerCase()] ?? null
  }
  const forwarded = get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : get("x-real-ip") ?? null
  const ua = get("user-agent") ?? get("User-Agent") ?? null
  return { ip, userAgent: ua }
}

export function extractNextRequestContext(req: { headers: { get(k: string): string | null } }): { ip: string | null; userAgent: string | null } {
  const forwarded = req.headers.get("x-forwarded-for")
  const ip = forwarded ? forwarded.split(",")[0]!.trim() : req.headers.get("x-real-ip") ?? null
  const ua = req.headers.get("user-agent") ?? null
  return { ip, userAgent: ua }
}
