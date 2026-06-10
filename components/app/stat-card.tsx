export function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <strong className="mt-2 block text-3xl font-semibold tracking-normal">{value}</strong>
      <p className="mt-2 text-xs text-[var(--muted)]">{detail}</p>
    </article>
  );
}
