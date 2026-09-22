import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  // All user IDs that appear in UserProfile
  const profileUserIds = (await prisma.userProfile.findMany({ select: { userId: true } })).map(p => p.userId)
  // All user IDs that appear in Slot.bookedBy
  const slotUserIds = (await prisma.slot.findMany({ where: { bookedBy: { not: null } }, select: { bookedBy: true } })).map(s => s.bookedBy!)
  // All actual User IDs
  const actualUserIds = (await prisma.user.findMany({ select: { id: true, name: true } })).map(u => u.id)

  const allReferenced = [...new Set([...profileUserIds, ...slotUserIds])]
  const orphaned = allReferenced.filter(id => !actualUserIds.includes(id))
  console.log("Profile user IDs:", profileUserIds.length)
  console.log("Slot bookedBy user IDs:", new Set(slotUserIds).size)
  console.log("Actual User IDs:", actualUserIds.length)
  console.log("Orphaned references (no User row):", orphaned.length)
  if (orphaned.length > 0) {
    console.log("Orphaned IDs:", orphaned)
  }
  await prisma.$disconnect()
}
main().catch(console.error)
