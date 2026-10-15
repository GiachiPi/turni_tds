import { prisma } from './prisma';

export async function getPeriodsHistory() {
  const closedPeriods = await prisma.period.findMany({
    where: { endDate: { not: null } },
    orderBy: { startDate: 'desc' },
    include: {
      snapshots: {
        include: { caretaker: true },
      },
    },
  });

  return closedPeriods.map((p) => ({
    id: p.id,
    startDate: p.startDate,
    endDate: p.endDate!,
    caretakers: p.snapshots.map((s) => ({
      id: s.caretakerId,
      name: s.caretaker.name,
      totalMinutes: s.totalMinutes,
      totalHours: (s.totalMinutes / 60).toFixed(1),
    })),
  }));
}

export async function getDashboardStats(year: number) {
  // STATISTICHE ANNUALI (Esistenti)
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year + 1, 0, 1);

  const allYearSlots = await prisma.timeSlot.findMany({
    where: { startTime: { gte: startOfYear, lt: endOfYear }, caretakerId: { not: null } },
    include: { caretaker: true },
  });

  const activeWeeks = new Set<string>();
  let annualTotalMinutes = 0;
  const annualByCaretaker: Record<string, { name: string; minutes: number }> = {};

  allYearSlots.forEach((s) => {
    const d = new Date(s.startTime);
    const onejan = new Date(d.getFullYear(), 0, 1);
    const week = Math.ceil(((d.getTime() - onejan.getTime()) / 86400000 + onejan.getDay() + 1) / 7);
    activeWeeks.add(`${d.getFullYear()}-W${week}`);
    
    annualTotalMinutes += s.durationMinutes;
    if (s.caretakerId && s.caretaker) {
      if (!annualByCaretaker[s.caretakerId]) annualByCaretaker[s.caretakerId] = { name: s.caretaker.name, minutes: 0 };
      annualByCaretaker[s.caretakerId].minutes += s.durationMinutes;
    }
  });

  const numWeeks = activeWeeks.size || 1;

  // STATISTICHE ASSOLUTE (Nuove: totale globale di sempre)
  const allTimeSlots = await prisma.timeSlot.findMany({
    where: { caretakerId: { not: null } },
    include: { caretaker: true },
  });

  let allTimeTotalMinutes = 0;
  const allTimeByCaretaker: Record<string, { name: string; minutes: number }> = {};

  allTimeSlots.forEach((s) => {
    allTimeTotalMinutes += s.durationMinutes;
    if (s.caretakerId && s.caretaker) {
      if (!allTimeByCaretaker[s.caretakerId]) allTimeByCaretaker[s.caretakerId] = { name: s.caretaker.name, minutes: 0 };
      allTimeByCaretaker[s.caretakerId].minutes += s.durationMinutes;
    }
  });

  return {
    annual: {
      year,
      weeksCount: activeWeeks.size,
      aggregate: {
        totalHours: (annualTotalMinutes / 60).toFixed(1),
        avgWeeklyHours: (annualTotalMinutes / 60 / numWeeks).toFixed(1),
      },
      caretakers: Object.values(annualByCaretaker)
        .map((c) => ({
          name: c.name,
          totalHours: (c.minutes / 60).toFixed(1),
          avgWeeklyHours: (c.minutes / 60 / numWeeks).toFixed(1),
        }))
        .sort((a, b) => Number(b.totalHours) - Number(a.totalHours)),
    },
    allTime: {
      totalHours: (allTimeTotalMinutes / 60).toFixed(1),
      caretakers: Object.values(allTimeByCaretaker)
        .map((c) => ({
          name: c.name,
          totalHours: (c.minutes / 60).toFixed(1),
        }))
        .sort((a, b) => Number(b.totalHours) - Number(a.totalHours)),
    }
  };
}