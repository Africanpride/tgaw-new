import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db/prisma"
import { createCommentSchema } from "@/lib/schemas/postSchema"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const comments = await prisma.comment.findMany({
    where: { postId: id, isHidden: false },
    orderBy: { createdAt: "asc" },
  })
  return NextResponse.json({ success: true, data: comments })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: req.headers })
  if (!session?.user)
    return NextResponse.json(
      { success: false, error: "Unauthorised" },
      { status: 401 }
    )

  const { id } = await params
  const body = await req.json()
  const validation = createCommentSchema.safeParse(body)
  if (!validation.success)
    return NextResponse.json(
      { success: false, error: validation.error.format() },
      { status: 400 }
    )

  const comment = await prisma.comment.create({
    data: {
      postId: id,
      authorId: session.user.id!,
      body: validation.data.body,
    },
  })

  return NextResponse.json({ success: true, data: comment }, { status: 201 })
}
