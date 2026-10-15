import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const { id } = await params;

  const period = await prisma.period.findUnique({ where: { id } });
  if (!period) {
    return NextResponse.json({ error: 'Periodo non trovato' }, { status: 404 });
  }

  const slots = await prisma.timeSlot.findMany({
    where: { periodId: id, caretakerId: { not: null } },
    include: { caretaker: true },
    orderBy: { startTime: 'asc' },
  });

  const formatDate = (d: Date) =>
    new Date(d).toLocaleDateString('it-IT', {
      weekday: 'long',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'Europe/Rome',
    });

  const formatTime = (d: Date) =>
    new Date(d).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Rome' });

  const periodStart = formatDate(period.startDate);
  const periodEnd = period.endDate ? formatDate(period.endDate) : 'in corso';

  const header = `Storico Turni - Periodo: ${periodStart} → ${periodEnd}\n`;
  const csvHeader = 'Data;Giorno;Inizio;Fine;Durata (min);Custode';
  const rows = slots.map((s) => {
    const d = new Date(s.startTime);
    const dayName = d.toLocaleDateString('it-IT', { weekday: 'long', timeZone: 'Europe/Rome' });
    const dateStr = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Rome' });
    const startStr = formatTime(s.startTime);
    const endStr = formatTime(s.endTime);
    const caretakerName = s.caretaker?.name ?? '';
    return `${dateStr};${dayName};${startStr};${endStr};${s.durationMinutes};${caretakerName}`;
  });

  const csv = [header, csvHeader, ...rows].join('\n');

  const filename = `turni_${period.startDate.toISOString().slice(0, 10)}_${
    period.endDate ? period.endDate.toISOString().slice(0, 10) : 'attuale'
  }.csv`;

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}
