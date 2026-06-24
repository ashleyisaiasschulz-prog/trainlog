// Shown instantly while a route's chunk/data loads, so tapping the nav always
// gives immediate visual feedback instead of feeling unresponsive.
export default function Loading() {
  return (
    <div className="px-4 pt-5 pb-28 space-y-4 animate-pulse">
      <div className="h-7 w-40 bg-zinc-900 rounded-lg" />
      <div className="h-24 bg-zinc-900 border border-zinc-800 rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 bg-zinc-900 border border-zinc-800 rounded-2xl" />
        <div className="h-20 bg-zinc-900 border border-zinc-800 rounded-2xl" />
      </div>
      <div className="h-40 bg-zinc-900 border border-zinc-800 rounded-2xl" />
      <div className="h-16 bg-zinc-900 border border-zinc-800 rounded-2xl" />
    </div>
  );
}
