import type { Metadata } from "next";
import Link from "next/link";
import { Gift } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Gift cards — coming soon",
  description: "SafariCart gift cards are coming soon.",
};

export default function GiftCardsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-20 text-center md:px-6">
      <span className="grid size-16 place-items-center rounded-2xl bg-accent/10 text-accent">
        <Gift className="size-8" />
      </span>
      <h1 className="font-heading text-4xl font-bold tracking-tight">
        Gift cards are coming soon
      </h1>
      <p className="max-w-prose text-lg text-muted-foreground">
        We&apos;re building gift cards so you can send credit straight to a
        friend&apos;s SafariCart account, redeemable on anything in the
        marketplace. Want a heads-up when they launch?
      </p>
      <Link href="/contact" className={buttonVariants({ size: "lg" })}>
        Tell us you&apos;re interested
      </Link>
    </div>
  );
}
