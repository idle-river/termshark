"use client";

import { AppPageShell } from "@/components/app-page-shell";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";
import { useEffect, useRef, useState } from "react";

const createTerminal = (): Terminal => {
  return new Terminal({
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
};

export default function TerminalPage() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const sessions = ["session-1", "session-2", "session-3"];
  const [activeSession, setActiveSession] = useState(sessions[0]);

  useEffect(() => {
    const container = terminalRef.current;
    if (!container) return;

    const term = createTerminal();
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
      insetClassName="bg-zinc-950"
      headerClassName="border-zinc-800 bg-zinc-950 text-zinc-100"
      mainClassName="flex min-h-0 flex-1 flex-col bg-zinc-950 p-3 md:p-5"
      contentClassName="flex min-h-0 flex-1"
    >
      <div className="flex h-full w-full min-h-0 flex-col gap-3">
        <aside className="flex shrink-0 flex-col rounded-xl border border-zinc-800 bg-zinc-900/70 p-3 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-300">
              Sessions
            </h2>
            <button
              type="button"
              className="rounded-md border border-zinc-700 px-2 py-1 text-xs font-medium text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              New
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {sessions.map((session, index) => {
              const isActive = session === activeSession;

              return (
                <button
                  key={session}
                  type="button"
                  onClick={() => setActiveSession(session)}
                  className={
                    isActive
                      ? "flex min-w-[140px] items-center justify-between rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-3 py-2 text-left text-sm font-medium text-cyan-100"
                      : "flex min-w-[140px] items-center justify-between rounded-lg border border-transparent bg-zinc-800/70 px-3 py-2 text-left text-sm text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800"
                  }
                >
                  <span>{`Session ${index + 1}`}</span>
                  <span
                    className={
                      isActive
                        ? "h-2 w-2 rounded-full bg-cyan-300"
                        : "h-2 w-2 rounded-full bg-zinc-600"
                    }
                  />
                </button>
              );
            })}
          </div>
        </aside>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/40">
          <div className="flex h-11 items-center justify-between border-b border-zinc-800 px-4">
            <p className="text-sm font-medium text-zinc-200">
              {activeSession.replace("-", " ")}
            </p>
            <span className="text-xs text-zinc-500">Connected</span>
          </div>
          <div
            className="terminal-surface h-full w-full flex-1 overflow-hidden bg-black"
            ref={terminalRef}
          ></div>
        </section>
      </div>
    </AppPageShell>
  );
}
