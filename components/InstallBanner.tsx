"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

export default function InstallBanner() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("trainlog-install-dismissed")) return;

    // Already installed?
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    setIsIOS(ios);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // iOS has no prompt event → show manual hint
    if (ios) setShow(true);

    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem("trainlog-install-dismissed", "1");
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-[55] max-w-md mx-auto">
      <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-3.5 shadow-2xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center shrink-0">
          <Download size={18} className="text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-zinc-100">Install TrainLog</p>
          {isIOS ? (
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              Tap <Share size={11} className="inline" /> then "Add to Home Screen"
            </p>
          ) : (
            <p className="text-xs text-zinc-500">Add it to your home screen like an app</p>
          )}
        </div>
        {!isIOS && deferred && (
          <button onClick={install}
            className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-3 py-2 rounded-xl shrink-0">
            Install
          </button>
        )}
        <button onClick={dismiss} className="text-zinc-600 hover:text-zinc-400 shrink-0 p-1">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
