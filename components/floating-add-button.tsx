"use client";
20;

import { Button } from "@/components/ui/button";
import { PlusIcon } from "@phosphor-icons/react";

type FloatingAddButtonProps = {
  onClick?: () => void;
  ariaLabel?: string;
};

export function FloatingAddButton({
  onClick,
  ariaLabel = "Add",
}: FloatingAddButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="fixed right-6 bottom-6 z-50 h-16 w-16 rounded-full bg-green-600 p-0 text-white shadow-lg transition-all duration-200 ease-out hover:scale-110 hover:bg-green-500 hover:shadow-2xl active:scale-100 active:shadow-lg"
    >
      <PlusIcon size={28} weight="bold" />
    </Button>
  );
}
