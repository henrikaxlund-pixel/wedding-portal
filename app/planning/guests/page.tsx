import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Navbar from '@/components/Navbar';
import GuestList from '@/components/GuestList';

export default async function GuestsPage() {
  const session = await auth();
  if (!session) redirect('/login');

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">
      <Navbar user={session.user} />
      <main className="flex-1 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-800">Guest List</h1>
          <p className="text-stone-500 text-sm mt-1">21 December 2026 · Helsinki</p>
        </div>
        <GuestList />
      </main>
    </div>
  );
}
