"use client";

import { useEffect } from "react";

const pinged = new Set<string>();

/** Registra uma leitura por carregamento da página. Sem cookies. */
export function ViewPing({ id }: { id: string }) {
  useEffect(() => {
    if (pinged.has(id)) return;
    pinged.add(id);
    const url = `/api/views/${id}`;
    if (typeof navigator.sendBeacon === "function" && navigator.sendBeacon(url)) return;
    void fetch(url, { method: "POST", keepalive: true }).catch(() => {});
  }, [id]);
  return null;
}
