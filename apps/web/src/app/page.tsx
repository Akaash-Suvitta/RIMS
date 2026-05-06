export default function HomePage() {
  // TODO: check auth state and redirect to /dashboard or /login accordingly.
  // For now render a placeholder until auth flow is implemented.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-navy-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">
          RegAxis RIM
        </h1>
        <p className="mt-3 text-lg text-slate-400">Coming Soon</p>
        <p className="mt-6 text-sm text-slate-500">
          Regulatory Information Management — Phase 6A scaffold
        </p>
      </div>
    </main>
  );
}
