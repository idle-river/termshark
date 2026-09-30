"use client";

import { AppPageShell } from "@/components/app-page-shell";
import { FloatingAddButton } from "@/components/floating-add-button";
import { toast } from "@/components/ui/toast";
import { invoke } from "@tauri-apps/api/core";
import { useQuery } from "@tanstack/react-query";

type Key = {
  id: number;
  label: string;
  pubkey: string;
  privkey: string;
};

export default function IdentityPage() {
  const {
    data: keys = [],
    isLoading,
    error,
  } = useQuery<Key[]>({
    queryKey: ["keys"],
    queryFn: async () => {
      try {
        return await invoke<Key[]>("get_keys");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message);
        throw new Error(message);
      } finally {
        console.log(keys);
      }
    },
  });

  return (
    <AppPageShell title="Identity">
      {isLoading && <p>Loading keys...</p>}
      {error && <p>Failed to load keys.</p>}
      {!isLoading && !error && keys.length === 0 && <p>No keys found.</p>}
      {keys.map((key) => (
        <p key={key.id}>{key.label}</p>
      ))}
      <FloatingAddButton ariaLabel="Add identity key" />
    </AppPageShell>
  );
}
