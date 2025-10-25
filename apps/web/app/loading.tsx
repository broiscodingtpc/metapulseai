export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#070a12] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Pulse ring */}
          <div className="absolute inset-0 animate-ping rounded-full bg-cyan-500/20 blur-xl" />
          {/* Spinner */}
          <svg className="w-16 h-16 animate-spin text-cyan-300" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          </svg>
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold tracking-wide">MetaPulse AI</p>
          <p className="text-sm text-zinc-400">Loading intelligence modules…</p>
        </div>
      </div>
    </div>
  );
}