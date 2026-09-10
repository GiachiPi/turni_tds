import { prisma } from '../lib/prisma';
import { isAdminAuthenticated } from '../lib/auth';
import ClientPortal from './components/ClientPortal';

export default async function HomePage() {
  const isAdmin = await isAdminAuthenticated();
  const caretakers = await prisma.caretaker.findMany({ where: { active: true }, orderBy: { name: 'asc' } });

  let activePeriod = await prisma.period.findFirst({ where: { endDate: null } });
  if (!activePeriod) activePeriod = await prisma.period.create({ data: {} });

  // Peschiamo tutti e soli gli slot assegnati al periodo non ancora azzerato
  const slots = await prisma.timeSlot.findMany({
    where: { periodId: activePeriod.id },
    include: { caretaker: true },
    orderBy: { startTime: 'asc' },
  });

  const hoursMap: Record<string, number> = {};
  slots.forEach((s) => {
    if (s.caretakerId) hoursMap[s.caretakerId] = (hoursMap[s.caretakerId] || 0) + s.durationMinutes;
  });

  return (
    <main className="min-h-screen bg-slate-50 pb-16">
      <ClientPortal isAdmin={isAdmin} caretakers={caretakers} slots={slots} hoursMap={hoursMap} />
    </main>
  );
}