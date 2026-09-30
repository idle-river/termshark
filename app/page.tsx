"use client";

import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export default function Page() {
  const [message, setMessage] = useState("No response yet");

  const handlePress = async () => {
    try {
      console.log("Button clicked");
      const response = await invoke<string>("greet");
      console.log("Rust response:", response);
      setMessage(response);
    } catch (error) {
      console.error("invoke('greet') failed:", error);
      setMessage(`Error: ${String(error)}`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-4xl text-green-700 text-center font-bold p-4">
        Hello, Next.js!
      </h1>

      <button
        className="rounded-xl bg-blue-600 text-white font-bold p-2 hover:bg-blue-700 transition-all duration-100 hover:scale-105 active:scale-90"
        onClick={handlePress}
      >
        Press Me
      </button>

      <p className="mt-4 text-sm text-slate-700">{message}</p>
    </div>
  );
}
