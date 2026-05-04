import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import UsersAdmin from '@/components/UsersAdmin';
import Navbar from '@/components/Navbar';

export default async function UsersPage() {
  const session = await auth();
  if (!session) redirect('/login');
  if ((session.user as any)?.role !== 'admin') redirect('/planning');

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar user={session.user} />
      <main className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-stone-800">User Management</h1>
          <p className="text-stone-700 text-sm mt-1">Manage who can access the planning portal</p>
        </div>
        <UsersAdmin />
      </main>
    </div>
  );
}
