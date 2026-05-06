"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  addToCartFormAction,
  type CartActionResult,
} from "@/server/actions/cart";

function SubmitButton({ inStock }: { inStock: boolean }) {
  const { pending } = useFormStatus();

  let label: React.ReactNode = inStock ? "Add to cart" : "Out of stock";
  if (pending) {
    label = (
      <>
        <Loader2 className="size-4 animate-spin" />
        Adding…
      </>
    );
  }

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={!inStock || pending}
    >
      {label}
    </Button>
  );
}

type Props = {
  productId: string;
  inStock: boolean;
};

export function AddToCartForm({ productId, inStock }: Props) {
  const [state, formAction] = useActionState<CartActionResult, FormData>(
    addToCartFormAction,
    null,
  );

  // Track which state object we've already toasted so React's
  // strict-mode double-invoke doesn't fire two toasts.
  const lastToastedRef = useRef<CartActionResult>(null);

  useEffect(() => {
    if (!state || state === lastToastedRef.current) return;
    lastToastedRef.current = state;
    if (state.ok) {
      toast.success(state.message, {
        icon: <Check className="size-4" />,
      });
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="productId" value={productId} />
      <SubmitButton inStock={inStock} />
    </form>
  );
}
