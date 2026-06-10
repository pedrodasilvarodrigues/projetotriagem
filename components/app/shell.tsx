import { AppNav } from "@/components/app/nav";
import { requireRole, roleFromEyebrow } from "@/lib/auth/access";

export async function AppShell({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  const expectedRole = roleFromEyebrow(eyebrow);
  const role = expectedRole ? await requireRole(expectedRole) : "professional";

  return (
    <div className="min-h-screen bg-[#eef3f7] text-slate-950">
      <AppNav role={role} />
      <main id="conteudo" className="mx-auto min-w-0 max-w-7xl px-5 py-6">
        <header className="mb-6 border-l-4 border-[#d6a238] bg-transparent py-2 pl-4">
          <p className="text-xs font-bold uppercase tracking-normal text-[#38506f]">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-[#18212f]">{title}</h1>
        </header>
        <section>{children}</section>
      </main>
    </div>
  );
}
