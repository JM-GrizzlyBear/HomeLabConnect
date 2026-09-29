export function FullPageSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50" role="status">
      <span className="size-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
