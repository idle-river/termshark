"use client";

import { AppPageShell } from "@/components/app-page-shell";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = terminalRef.current;
    if (!container) return;

    const term = new Terminal();
    term.open(container);

    const getSize = () => {
      const rect = container.getBoundingClientRect();
      const cols = Math.max(2, Math.floor(rect.width / 9));
      const rows = Math.max(2, Math.floor(rect.height / 18));
      return { cols, rows };
    };

    const applyResize = () => {
      const { cols, rows } = getSize();
      term.resize(cols, rows);
      void invoke("resize_terminal", { cols, rows });
    };

    applyResize();

    const resizeObserver = new ResizeObserver(() => {
      applyResize();
    });

    resizeObserver.observe(container);

    const dataDisposable = term.onData((data) => {
      void invoke("write_to_terminal", { data });
    });

    let unlisten: (() => void) | undefined;

    void (async () => {
      unlisten = await listen<string>("terminal-output", (event) => {
        term.write(event.payload);
      });
    })();

    return () => {
      resizeObserver.disconnect();
      dataDisposable.dispose();
      unlisten?.();
      term.dispose();
    };
  }, []);

  return (
    <AppPageShell>
      <div
        className="h-[70vh] w-full overflow-hidden rounded-md border"
        ref={terminalRef}
      ></div>
    </AppPageShell>
  );
}
