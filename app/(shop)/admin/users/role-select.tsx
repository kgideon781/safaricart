"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import type { UserRole } from "@prisma/client";
import { setUserRoleAction } from "@/server/actions/admin";

const ROLES: UserRole[] = ["CUSTOMER", "VENDOR", "ADMIN"];

export function RoleSelect({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: UserRole;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentRole}
      disabled={pending}
      aria-label={isSelf ? "Your role" : "Set role"}
      title={isSelf ? "Promote a colleague before demoting yourself" : undefined}
      className="h-8 rounded-md border border-border bg-background px-2 text-xs font-medium disabled:opacity-50"
      onChange={(event) => {
        const next = event.target.value as UserRole;
        if (next === currentRole) return;
        const fd = new FormData();
        fd.set("userId", userId);
        fd.set("role", next);
        startTransition(async () => {
          const result = await setUserRoleAction(fd);
          if (result?.error) {
            toast.error(result.error);
            event.target.value = currentRole; // revert visual
          } else if (result?.success) {
            toast.success(result.success);
          }
        });
      }}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>
          {r}
        </option>
      ))}
    </select>
  );
}
