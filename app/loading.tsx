export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
      <div className="relative flex items-center justify-center">
        {/* Loading Spinner */}
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3271bc]"></div>
        <div className="absolute animate-ping h-8 w-8 rounded-full border border-[#f2671e]/50 opacity-75"></div>
      </div>
      <p className="mt-4 text-xs font-semibold text-zinc-500 uppercase tracking-widest animate-pulse">
        Loading Details...
      </p>
    </div>
  );
}
