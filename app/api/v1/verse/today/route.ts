import { NextResponse } from "next/server"
import { getVerseOfDay } from "@/lib/services/verseService"

export async function GET() {
  try {
    return NextResponse.json({ success: true, data: getVerseOfDay() })
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
