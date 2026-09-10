'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated, createAdminSession, clearAdminSession } from '@/lib/auth';

async function getOrCreateActivePeriod() {
  let active = await prisma.period.findFirst({ where: { endDate: null } });
  if (!active) {
    active = await prisma.period.create({ data: {} });
  }
  return active;
}

export async function addCaretaker(name: string) {
  if (!(await isAdminAuthenticated())) throw new Error('Non autorizzato');
  await prisma.caretaker.create({ data: { name: name.trim() } });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function toggleCaretakerActive(id: string, active: boolean) {
  if (!(await isAdminAuthenticated())) throw new Error('Non autorizzato');
  await prisma.caretaker.update({ where: { id }, data: { active } });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function createTimeSlot(startTimeStr: string, endTimeStr: string) {
  if (!(await isAdminAuthenticated())) throw new Error('Non autorizzato');
  const start = new Date(startTimeStr);
  const end = new Date(endTimeStr);
  const diffMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

  if (diffMinutes <= 0) throw new Error('Orario non valido');

  const period = await getOrCreateActivePeriod();

  await prisma.timeSlot.create({
    data: {
      startTime: start,
      endTime: end,
      durationMinutes: diffMinutes,
      periodId: period.id
    },
  });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function deleteTimeSlot(id: string) {
  if (!(await isAdminAuthenticated())) throw new Error('Non autorizzato');
  await prisma.timeSlot.delete({ where: { id } });
  revalidatePath('/');
}

export async function toggleBookSlot(slotId: string, caretakerId: string) {
  const slot = await prisma.timeSlot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error('Slot inesistente');

  if (!slot.caretakerId) {
    await prisma.timeSlot.update({
      where: { id: slotId },
      data: { caretakerId },
    });
  } else if (slot.caretakerId === caretakerId) {
    await prisma.timeSlot.update({
      where: { id: slotId },
      data: { caretakerId: null },
    });
  } else {
    throw new Error('Slot occupato');
  }
  revalidatePath('/');
}

export async function closeAndResetPeriod() {
  if (!(await isAdminAuthenticated())) throw new Error('Non autorizzato');
  const currentPeriod = await getOrCreateActivePeriod();

  const bookedSlots = await prisma.timeSlot.findMany({
    where: { periodId: currentPeriod.id, caretakerId: { not: null } },
  });

  const totalsByCaretaker: Record<string, number> = {};
  for (const slot of bookedSlots) {
    if (slot.caretakerId) {
      totalsByCaretaker[slot.caretakerId] = (totalsByCaretaker[slot.caretakerId] || 0) + slot.durationMinutes;
    }
  }

  for (const [cId, total] of Object.entries(totalsByCaretaker)) {
    await prisma.periodSnapshot.create({
      data: { periodId: currentPeriod.id, caretakerId: cId, totalMinutes: total },
    });
  }

  const now = new Date();
  await prisma.period.update({
    where: { id: currentPeriod.id },
    data: { endDate: now },
  });

  await prisma.period.create({ data: { startDate: now } });
  revalidatePath('/');
  revalidatePath('/admin');
}

export async function loginAdmin(password: string) {
  if (password === process.env.ADMIN_PASSWORD) {
    await createAdminSession();
    return { success: true };
  }
  return { success: false, error: 'Password errata' };
}

export async function logoutAdmin() {
  await clearAdminSession();
  revalidatePath('/');
  revalidatePath('/admin');
}
