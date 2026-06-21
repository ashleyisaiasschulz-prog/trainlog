"use client";

export default function Splash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 overflow-hidden">
      <style>{`
        @keyframes spl-ring   { to { stroke-dashoffset: 40; } }
        @keyframes spl-spin   { to { transform: rotate(360deg); } }
        @keyframes spl-up     { 0% { opacity: 0; transform: translateY(16px) scale(.95); } 100% { opacity: 1; transform: none; } }
        @keyframes spl-belt   { to { transform: scaleX(1); } }
        @keyframes spl-dot    { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: .55; } }
        @keyframes spl-glow   { 0%,100% { opacity: .15; } 50% { opacity: .4; } }
      `}</style>

      {/* Mark */}
      <div className="relative w-24 h-24 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-red-500 blur-2xl" style={{ animation: "spl-glow 2s ease-in-out infinite" }} />
        <svg width="96" height="96" viewBox="0 0 96 96" className="relative" style={{ animation: "spl-spin 2.4s linear infinite" }}>
          <circle cx="48" cy="48" r="40" stroke="#27272a" strokeWidth="5" fill="none" />
          <circle cx="48" cy="48" r="40" stroke="#ef4444" strokeWidth="5" fill="none" strokeLinecap="round"
            strokeDasharray="251" strokeDashoffset="251"
            style={{ animation: "spl-ring 1s cubic-bezier(.6,0,.2,1) forwards" }} />
        </svg>
        <span className="absolute text-3xl font-black text-red-500" style={{ animation: "spl-dot 1.3s ease-in-out infinite" }}>柔</span>
      </div>

      {/* Wordmark */}
      <div className="mt-6 flex flex-col items-center gap-3" style={{ animation: "spl-up .6s ease-out .25s both" }}>
        <h1 className="text-3xl font-black tracking-tight text-zinc-100">
          Grapplr<span className="text-red-500">.</span>
        </h1>
        <div className="h-[3px] w-28 rounded-full bg-red-500 origin-left"
          style={{ transform: "scaleX(0)", animation: "spl-belt .7s cubic-bezier(.6,0,.2,1) .5s forwards" }} />
        <p className="text-[10px] text-zinc-600 tracking-[0.3em] uppercase">Track your BJJ</p>
      </div>
    </div>
  );
}
