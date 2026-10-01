"use client";

import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type JSX,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

type IdentType = "identity" | "key";

type KeyData = {
  id: number;
  label: string;
  pubkey: string;
  privkey: string;
};

type IdentCardProps = {
  type: IdentType;
  data: KeyData;
  onRequestDelete: (key: KeyData) => void;
};

function truncateMiddle(value: string, keep = 16): string {
  const trimmed = value.trim();

  if (trimmed.length <= keep * 2 + 3) {
    return trimmed;
  }

  return `${trimmed.slice(0, keep)}...${trimmed.slice(-keep)}`;
}

export function IdentCard({
  type,
  data,
  onRequestDelete,
}: IdentCardProps): JSX.Element | null {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [pubkey, setPubkey] = useState(data.pubkey);
  const [privkey, setPrivkey] = useState(data.privkey);
  const queryClient = useQueryClient();

  const { mutateAsync: updateKey, isPending: isSaving } = useMutation({
    mutationKey: ["keys", "update", data.id],
    mutationFn: async ({
      id,
      label,
      pubkey,
      privkey,
    }: KeyData): Promise<KeyData> => {
      return invoke<KeyData>("update_key", {
        keyId: id,
        label,
        pubkey,
        privkey,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["keys"] });
    },
  });

  const pubkeyPreview = useMemo(
    () => truncateMiddle(data.pubkey),
    [data.pubkey],
  );
  const privkeyPreview = useMemo(
    () => truncateMiddle(data.privkey.replace(/\r?\n/g, " ")),
    [data.privkey],
  );
  const hasChanges =
    label !== data.label || pubkey !== data.pubkey || privkey !== data.privkey;

  useEffect(() => {
    setLabel(data.label);
    setPubkey(data.pubkey);
    setPrivkey(data.privkey);
  }, [data.id, data.label, data.pubkey, data.privkey]);

  if (type === "identity") {
    return null;
  }

  return (
    <>
      <Card size="sm">
        <CardHeader>
          <CardTitle>{data.label}</CardTitle>
          <CardDescription>ID: {data.id}</CardDescription>
          <CardAction className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => {}}>
              Logs
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsEditOpen(true)}
            >
              Edit
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Public Key</p>
            <p className="break-all font-mono text-xs">{pubkeyPreview}</p>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Private Key</p>
            <p className="break-all font-mono text-xs">{privkeyPreview}</p>
          </div>
        </CardContent>
      </Card>

      <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>Edit Key</SheetTitle>
            <SheetDescription>
              Update label, public key, and private key for this identity key.
            </SheetDescription>
          </SheetHeader>

          <form
            className="flex h-full flex-col gap-4 p-6 pt-0"
            onSubmit={async (event: FormEvent<HTMLFormElement>) => {
              event.preventDefault();

              if (!label.trim() || !pubkey.trim() || !privkey.trim()) {
                return;
              }

              await toast.promise(
                updateKey({
                  id: data.id,
                  label,
                  pubkey,
                  privkey,
                }),
                {
                  pending: "Saving key changes...",
                  success: "Key updated successfully.",
                  error: (err) =>
                    err instanceof Error ? err.message : String(err),
                },
              );
              setIsEditOpen(false);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor={`edit-label-${data.id}`}>Label</Label>
              <Input
                id={`edit-label-${data.id}`}
                value={label}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setLabel(event.target.value)
                }
                placeholder="Work laptop"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`edit-pubkey-${data.id}`}>Public Key</Label>
              <Input
                id={`edit-pubkey-${data.id}`}
                value={pubkey}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  setPubkey(event.target.value)
                }
                className="font-mono"
              />
            </div>

            <div className="flex min-h-0 flex-1 flex-col space-y-2">
              <Label htmlFor={`edit-privkey-${data.id}`}>Private Key</Label>
              <Textarea
                id={`edit-privkey-${data.id}`}
                value={privkey}
                onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                  setPrivkey(event.target.value)
                }
                className="min-h-40 flex-1 font-mono"
              />
            </div>

            <SheetFooter className="mt-auto p-0">
              <Button type="button" variant="outline" onClick={() => {}}>
                Export to host
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={isSaving}
                onClick={() => {
                  setIsEditOpen(false);
                  onRequestDelete(data);
                }}
              >
                Delete Key
              </Button>
              <Button
                type="submit"
                disabled={
                  isSaving ||
                  !hasChanges ||
                  !label.trim() ||
                  !pubkey.trim() ||
                  !privkey.trim()
                }
              >
                {isSaving ? "Saving..." : "Save changes"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
