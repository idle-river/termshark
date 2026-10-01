"use client";

import { AppPageShell } from "@/components/app-page-shell";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef } from "react";

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const sessions = ["session-1", "session-2", "session-3"];

  useEffect(() => {
    const container = terminalRef.current;
    if (!container) return;

    const term = new Terminal({
      allowTransparency: true,
      cursorBlink: true,
      cursorStyle: "bar",
      fontFamily:
        '"JetBrainsMono Nerd Font", "MesloLGS NF", "Symbols Nerd Font Mono", "SFMono-Regular", Menlo, Consolas, "Liberation Mono", monospace',
      fontSize: 14,
      lineHeight: 1.25,
      letterSpacing: 0.15,
      theme: {
        background: "#0b1020cc",
        foreground: "#d7dde8",
        cursor: "#8ae8cf",
        cursorAccent: "#0b1020",
        selectionBackground: "#4cc9f066",
        black: "#1f2937",
        red: "#f87171",
        green: "#34d399",
        yellow: "#facc15",
        blue: "#60a5fa",
        magenta: "#f472b6",
        cyan: "#22d3ee",
        white: "#e5e7eb",
        brightBlack: "#6b7280",
        brightRed: "#fca5a5",
        brightGreen: "#86efac",
        brightYellow: "#fde047",
        brightBlue: "#93c5fd",
        brightMagenta: "#f9a8d4",
        brightCyan: "#67e8f9",
        brightWhite: "#f9fafb",
      },
    });
    const fitAddon = new FitAddon();

    term.loadAddon(fitAddon);
    term.open(container);

    term.focus();

    const applyResize = () => {
      fitAddon.fit();
      void invoke("resize_terminal", { cols: term.cols, rows: term.rows });
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
    <AppPageShell
      insetClassName="bg-background"
      headerClassName="bg-white text-foreground border-border"
      mainClassName="relative flex flex-1 min-h-0 flex-col bg-black px-4 py-4 md:px-6 md:py-6"
      contentClassName="flex min-h-0 flex-1"
      headerContent={
        <div className="overflow-x-auto">
          <div className="inline-flex h-10 items-center rounded-lg border border-zinc-200 bg-white p-1 text-zinc-500 shadow-sm">
            {sessions.map((session, index) => (
              <button
                key={session}
                type="button"
                className={
                  index === 0
                    ? "inline-flex h-8 items-center rounded-md bg-zinc-900 px-3 text-sm font-medium text-white shadow"
                    : "inline-flex h-8 items-center rounded-md px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                }
              >
                {`Session ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div
        className="terminal-surface h-full w-full flex-1 overflow-hidden bg-black"
        ref={terminalRef}
      ></div>
    </AppPageShell>
  );
}
