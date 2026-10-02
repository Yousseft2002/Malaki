import { AdminNav } from "@/components/admin/admin-nav";
import { requireAdmin } from "@/lib/auth/admin";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <AdminNav />
      <main id="main" className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </>
  );
}
