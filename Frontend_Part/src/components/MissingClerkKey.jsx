export default function MissingClerkKey() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-md rounded-lg border border-white/10 bg-white/5 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-300">
          Clerk setup required
        </p>
        <h1 className="mt-3 text-2xl font-bold">Add your Clerk publishable key.</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          Set `VITE_CLERK_PUBLISHABLE_KEY` in `Frontend_Part/.env` to run the app with Clerk authentication.
        </p>
      </div>
    </div>
  );
}
