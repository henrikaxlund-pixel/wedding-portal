import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard';
import Navbar from '@/components/Navbar';

export default async function PlanningPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar user={session.user} />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-800">Wedding Planning</h1>
          <p className="text-stone-700 text-sm mt-1">21 December 2026 Â· Helsinki</p>
        </div>
        <KanbanBoard />
      </main>
    </div>
  );
}
