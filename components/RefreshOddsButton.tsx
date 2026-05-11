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
      className="eyebrow disabled:opacity-50"
      style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer" }}
    >
      {refreshing ? "↻ Refreshing…" : "↻ Refresh"}
    </button>
  );
}
