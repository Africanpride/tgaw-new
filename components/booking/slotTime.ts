export function convertUtcTimeToLocal(utcTime: string) {
  const [hours, minutes] = utcTime.split(":");
  const d = new Date();
  d.setUTCHours(parseInt(hours, 10));
  d.setUTCMinutes(parseInt(minutes, 10));
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function isPastSlot(slot: { date?: string; startTime: string }): boolean {
  if (!slot.date) return false;
  const now = new Date();
  const slotStart = new Date(`${slot.date}T${slot.startTime}:00Z`);
  return now >= slotStart;
}

export function isCurrentSlot(slot: { date?: string; startTime: string; endTime: string }): boolean {
  if (!slot.date) return false;
  const now = new Date();
  const slotStart = new Date(`${slot.date}T${slot.startTime}:00Z`);
  const endTimeStr = slot.endTime === "24:00" ? "23:59:59" : `${slot.endTime}:00`;
  const slotEnd = new Date(`${slot.date}T${endTimeStr}Z`);
  return now >= slotStart && now < slotEnd;
}