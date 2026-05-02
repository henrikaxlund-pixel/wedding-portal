import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import ProgramEditor from '@/components/ProgramEditor';
import Navbar from '@/components/Navbar';

export default async function ProgramPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar user={session.user} />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-800">Program</h1>
          <p className="text-stone-500 text-sm mt-1">21 December 2026 · Helsinki</p>
        </div>
        <ProgramEditor />
      </main>
    </div>
  );
}
