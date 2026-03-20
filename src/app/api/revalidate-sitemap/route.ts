import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST() {
  try {
    revalidatePath('/sitemap.xml')
    return NextResponse.json({ revalidated: true })
  } catch {
    return NextResponse.json({ revalidated: false })
  }
}
