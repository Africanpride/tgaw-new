import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { createPostSchema } from "@/lib/schemas/postSchema"

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const limit = Number(searchParams.get("limit")) || 20

  const posts = await prisma.post.findMany({
    where: { isHidden: false },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor
      ? { cursor: { id: cursor }, skip: 1 }
      : {}),
    include: {
      _count: { select: { comments: true, likes: true } },
    },
  })

  const hasMore = posts.length > limit
  const data = hasMore ? posts.slice(0, limit) : posts

  return NextResponse.json({
    success: true,
    data,
    nextCursor: hasMore ? data[data.length - 1]?.id : null,
  })
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const body = await req.json()
  const validation = createPostSchema.safeParse(body)
  if (!validation.success)
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 }
    )

  const { poll, ...postData } = validation.data
  const post = await prisma.post.create({
    data: {
      ...postData,
      authorId: session.user.id!,
      ...(poll && {
        poll: {
          create: {
            question: poll.question,
            options: {
              create: poll.options.map((label) => ({ label })),
            },
            closesAt: poll.closesAt ? new Date(poll.closesAt) : undefined,
          },
        },
      }),
    },
    include: { poll: { include: { options: true } } },
  })

  return NextResponse.json({ success: true, data: post }, { status: 201 })
}
