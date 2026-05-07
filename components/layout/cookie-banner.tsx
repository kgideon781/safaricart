"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "sc_cookies_v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch {
      // ignore (privacy mode etc.)
    }
  }, []);

  function dismiss(choice: "accept" | "decline") {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      // ignore
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-xl border border-border bg-card p-4 shadow-lg"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <p className="flex-1 text-sm text-muted-foreground">
          We use strictly necessary cookies to keep you signed in and remember
          your cart, plus optional analytics to improve the experience. See our{" "}
          <Link href="/legal/cookies" className="underline hover:text-foreground">
            Cookies Policy
          </Link>
          .
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => dismiss("decline")}>
            Decline analytics
          </Button>
          <Button size="sm" onClick={() => dismiss("accept")}>
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
