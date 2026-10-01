"use client";

import { AppPageShell } from "@/components/app-page-shell";
import { FloatingAddButton } from "@/components/floating-add-button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { invoke } from "@tauri-apps/api/core";
import {
  useIsFetching,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

type Key = {
  id: number;
  label: string;
  pubkey: string;
  privkey: string;
};

export default function IdentityPage() {
  const [show, setShow] = useState(false);
  const [label, setLabel] = useState("");
  const [pubkey, setPubkey] = useState("");
  const [privkey, setPrivkey] = useState("");
  const queryClient = useQueryClient();
  const isFetchingKeys = useIsFetching({ queryKey: ["keys"] });
  const pubFileInputRef = useRef<HTMLInputElement>(null);
  const privFileInputRef = useRef<HTMLInputElement>(null);

  const {
    data: keys = [],
    isLoading,
    error,
  } = useQuery<Key[]>({
    queryKey: ["keys"],
    queryFn: async () => {
      try {
        console.info("[identity] fetching keys");
        return await invoke<Key[]>("get_keys");
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[identity] failed to fetch keys:", message);
        toast.error(message);
        throw new Error(message);
      }
    },
  });

  const { mutateAsync: addKey } = useMutation({
    mutationKey: ["keys"],
    mutationFn: async ({
      label,
      pubkey,
      privkey,
    }: {
      label: string;
      pubkey: string;
      privkey: string;
    }) => {
      try {
        console.info("[identity] creating key", { label });
        return await invoke("create_key", { label, pubkey, privkey });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("[identity] failed to create key:", message);
        throw err;
      }
    },
    onSuccess: async () => {
      const before = queryClient.getQueryState<Key[]>(["keys"]);
      console.info("[identity] key created, invalidating keys query", {
        beforeStatus: before?.status,
        beforeFetchStatus: before?.fetchStatus,
        beforeDataUpdatedAt: before?.dataUpdatedAt,
      });

      await queryClient.invalidateQueries({
        queryKey: ["keys"],
        refetchType: "all",
      });

      const after = queryClient.getQueryState<Key[]>(["keys"]);
      console.info("[identity] invalidation finished", {
        afterStatus: after?.status,
        afterFetchStatus: after?.fetchStatus,
        afterDataUpdatedAt: after?.dataUpdatedAt,
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[identity] mutation error:", message);
    },
  });

  const handleImportFile = async (
    event: ChangeEvent<HTMLInputElement>,
    expectedExtension: ".pub" | ".pem",
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(expectedExtension)) {
      toast.error(`Please select a ${expectedExtension} file.`);
      event.target.value = "";
      return;
    }

    try {
      const contents = await file.text();

      if (expectedExtension === ".pub") {
        setPubkey(contents.replace(/\r?\n/g, "").trim());
      } else {
        setPrivkey(contents);
      }
    } catch {
      toast.error("Failed to read key file.");
    }

    event.target.value = "";
  };

  useEffect(() => {
    console.info("[identity] keys state updated", {
      keyCount: keys.length,
      labels: keys.map((key) => key.label),
    });
  }, [keys]);

  useEffect(() => {
    console.info("[identity] keys query fetching count", { isFetchingKeys });
  }, [isFetchingKeys]);

  return (
    <>
      <AppPageShell>
        {isLoading && <p>Loading keys...</p>}
        {error && <p>Failed to load keys.</p>}
        {!isLoading && !error && keys.length === 0 && <p>No keys found.</p>}
        {keys.map((key) => (
          <p key={key.id}>{key.label}</p>
        ))}
      </AppPageShell>

      <FloatingAddButton
        ariaLabel="Add identity key"
        onClick={() => setShow(true)}
      />

      <Dialog open={show} onOpenChange={setShow}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Add Identity Key</DialogTitle>
            <DialogDescription>
              Adding an identity key will allow you to make SSH connections to
              your servers much easier.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              await toast.promise(addKey({ label, pubkey, privkey }), {
                pending: "Adding key...",
                success: "Key added successfully.",
                error: (err) =>
                  err instanceof Error ? err.message : String(err),
              });
              setShow(false);
              setLabel("");
              setPubkey("");
              setPrivkey("");
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="identity-label">Label</Label>
              <Input
                id="identity-label"
                value={label}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setLabel(event.target.value)
                }
                placeholder="Work laptop"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="identity-public-key">Public Key</Label>
              <Input
                id="identity-public-key"
                value={pubkey}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setPubkey(event.target.value)
                }
                placeholder="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA... your-email@example.com"
                className="font-mono"
              />
              <input
                ref={pubFileInputRef}
                type="file"
                accept=".pub"
                className="hidden"
                onChange={(event) => void handleImportFile(event, ".pub")}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => pubFileInputRef.current?.click()}
              >
                Import Public Key (.pub)
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="identity-private-key">Private Key</Label>
              <Textarea
                id="identity-private-key"
                value={privkey}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setPrivkey(event.target.value)
                }
                placeholder="-----BEGIN OPENSSH PRIVATE KEY-----"
                className="min-h-40 font-mono"
              />
              <input
                ref={privFileInputRef}
                type="file"
                accept=".pem"
                className="hidden"
                onChange={(event) => void handleImportFile(event, ".pem")}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => privFileInputRef.current?.click()}
              >
                Import Private Key (.pem)
              </Button>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!label.trim() || !pubkey.trim() || !privkey.trim()}
            >
              Continue
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
