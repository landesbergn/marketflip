// components/RefreshOddsButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefreshOddsButton() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onClick = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <button
      onClick={onClick}
      disabled={refreshing}
      className="text-xs text-zinc-500 hover:text-zinc-900 underline-offset-2 hover:underline disabled:opacity-60"
    >
      {refreshing ? "Refreshing…" : "Refresh odds"}
    </button>
  );
}
