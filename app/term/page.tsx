"use client";

import { AppPageShell } from "@/components/app-page-shell";
import { invoke } from "@tauri-apps/api/core";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new Terminal();
    term.open(terminalRef.current);

    term.onData(async (data) => {
      await invoke("write_to_terminal", { data });
    });

    return () => {
      term.dispose();
    };
  }, []);

  return (
    <AppPageShell title="Terminal">
      <div ref={terminalRef}></div>
    </AppPageShell>
  );
}
