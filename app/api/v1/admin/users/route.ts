import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"

const listUsersSchema = z.object({
	searchValue: z.string().optional(),
	limit: z.coerce.number().int().positive().max(100).optional().default(50),
	offset: z.coerce.number().int().min(0).optional().default(0),
})

export async function GET(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() })
	const role = (session?.user as { role?: string } | undefined)?.role
	if (!session?.user || role !== "superadmin") {
		return NextResponse.json(
			{ success: false, error: "Unauthorised" },
			{ status: 401 }
		)
	}

	const { searchParams } = new URL(req.url)
	const parsed = listUsersSchema.safeParse({
		searchValue: searchParams.get("search") ?? undefined,
		limit: searchParams.get("limit") ?? undefined,
		offset: searchParams.get("offset") ?? undefined,
	})
	if (!parsed.success) {
		return NextResponse.json(
			{ success: false, error: parsed.error.flatten() },
			{ status: 400 }
		)
	}

	const { searchValue, limit, offset } = parsed.data

	try {
		const whereClause = searchValue
			? {
					OR: [
						{ email: { contains: searchValue, mode: "insensitive" as const } },
						{ name: { contains: searchValue, mode: "insensitive" as const } },
					],
				}
			: {}

		const [usersList, totalCount] = await Promise.all([
			prisma.user.findMany({
				where: whereClause,
				take: limit,
				skip: offset,
				orderBy: { createdAt: "desc" },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					banned: true,
					banReason: true,
					image: true,
					emailVerified: true,
					createdAt: true,
				},
			}),
			prisma.user.count({ where: whereClause }),
		])

		const users = usersList.map((u) => ({
			id: u.id,
			name: u.name,
			email: u.email,
			role: u.role ?? "member",
			banned: u.banned ?? false,
			banReason: u.banReason ?? null,
			image: u.image ?? null,
			emailVerified: u.emailVerified ?? false,
			createdAt: u.createdAt ?? null,
		}))

		return NextResponse.json({
			success: true,
			data: users,
			total: totalCount,
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : "Failed to fetch users"
		return NextResponse.json(
			{ success: false, error: message },
			{ status: 500 }
		)
	}
}
