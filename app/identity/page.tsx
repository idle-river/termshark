"use client";

import { AppPageShell } from "@/components/app-page-shell";
import { FloatingAddButton } from "@/components/floating-add-button";
import { IdentCard } from "@/components/ident-card";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { invoke } from "@tauri-apps/api/core";
import { MagnifyingGlassIcon, PlusIcon } from "@phosphor-icons/react";
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
  const HOLD_TO_DELETE_MS = 1200;
  const [show, setShow] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isHoldingDelete, setIsHoldingDelete] = useState(false);
  const [deleteTargetIds, setDeleteTargetIds] = useState<number[]>([]);
  const [label, setLabel] = useState("");
  const [pubkey, setPubkey] = useState("");
  const [privkey, setPrivkey] = useState("");
  const queryClient = useQueryClient();
  const isFetchingKeys = useIsFetching({ queryKey: ["keys"] });
  const pubFileInputRef = useRef<HTMLInputElement>(null);
  const privFileInputRef = useRef<HTMLInputElement>(null);
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredDeleteRef = useRef(false);

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

  const { mutateAsync: deleteAllKeys, isPending: isDeletingAll } = useMutation({
    mutationKey: ["keys", "delete-all"],
    mutationFn: async (ids: number[]) => {
      await Promise.all(ids.map((id) => invoke("delete_key", { keyId: id })));
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["keys"],
        refetchType: "all",
      });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[identity] failed to delete keys:", message);
    },
  });

  const stopMassDeleteHold = (): void => {
    if (holdTimeoutRef.current !== null) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }

    if (!hasTriggeredDeleteRef.current) {
      setIsHoldingDelete(false);
    }
  };

  const confirmMassDelete = async (): Promise<void> => {
    const ids = deleteTargetIds;

    if (ids.length === 0) {
      setIsMassDeleteOpen(false);
      stopMassDeleteHold();
      return;
    }

    try {
      await toast.promise(deleteAllKeys(ids), {
        pending: `Deleting ${ids.length} ${ids.length === 1 ? "key" : "keys"}...`,
        success: `Deleted ${ids.length} ${ids.length === 1 ? "key" : "keys"}.`,
        error: (err) => (err instanceof Error ? err.message : String(err)),
      });
      setIsDeleteDialogOpen(false);
      setDeleteTargetIds([]);
    } finally {
      setIsHoldingDelete(false);
      stopMassDeleteHold();
      hasTriggeredDeleteRef.current = false;
    }
  };

  const startMassDeleteHold = (): void => {
    if (isDeletingAll || deleteTargetIds.length === 0) {
      return;
    }

    hasTriggeredDeleteRef.current = false;
    setIsHoldingDelete(true);

    holdTimeoutRef.current = setTimeout(() => {
      if (hasTriggeredDeleteRef.current) {
        return;
      }

      hasTriggeredDeleteRef.current = true;
      void confirmMassDelete();
    }, HOLD_TO_DELETE_MS);
  };

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

  useEffect(() => {
    if (!isDeleteDialogOpen) {
      stopMassDeleteHold();
      setDeleteTargetIds([]);
    }
  }, [isDeleteDialogOpen]);

  useEffect(() => {
    return () => {
      stopMassDeleteHold();
    };
  }, []);

  return (
    <>
      <AppPageShell>
        {isLoading && <p>Loading keys...</p>}
        {error && <p>Failed to load keys.</p>}
        {!isLoading && !error && keys.length === 0 && (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-3 text-muted-foreground/50">
                <MagnifyingGlassIcon className="size-6" />
                <PlusIcon className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground/80">No keys found</p>
              <p className="max-w-sm text-xs text-muted-foreground/60">
                Add your first identity key to start making SSH connections.
              </p>
            </div>
          </div>
        )}
        {keys.length > 0 && (
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                setDeleteTargetIds(keys.map((key) => key.id));
                setIsDeleteDialogOpen(true);
              }}
            >
              Delete All Keys
            </Button>
          </div>
        )}
        {keys.length > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {keys.map((key) => (
              <IdentCard
                key={key.id}
                type="key"
                data={key}
                onRequestDelete={(selectedKey) => {
                  setDeleteTargetIds([selectedKey.id]);
                  setIsDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
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

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Delete {deleteTargetIds.length}{" "}
              {deleteTargetIds.length === 1 ? "key" : "keys"}?
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteTargetIds.length}{" "}
              {deleteTargetIds.length === 1 ? "key" : "keys"}? This action
              cannot be undone. Hold the button to confirm.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="sm:justify-between" showCloseButton>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeletingAll || deleteTargetIds.length === 0}
              className="relative w-full overflow-hidden sm:w-auto"
              onMouseDown={(event) => {
                if (event.button !== 0) {
                  return;
                }

                startMassDeleteHold();
              }}
              onMouseUp={stopMassDeleteHold}
              onMouseLeave={stopMassDeleteHold}
              onTouchStart={startMassDeleteHold}
              onTouchEnd={stopMassDeleteHold}
              onTouchCancel={stopMassDeleteHold}
              onContextMenu={(event) => event.preventDefault()}
            >
              <span
                className="absolute inset-y-0 left-0 bg-destructive"
                style={{
                  width: isHoldingDelete ? "100%" : "0%",
                  transition: `width ${HOLD_TO_DELETE_MS}ms linear`,
                }}
                aria-hidden="true"
              />
              <span
                className={`relative z-10 transition-colors ${
                  isHoldingDelete ? "!text-white" : "!text-destructive"
                }`}
              >
                {isDeletingAll
                  ? "Deleting..."
                  : deleteTargetIds.length === 1
                    ? "Hold to delete"
                    : "Hold to delete all"}
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
