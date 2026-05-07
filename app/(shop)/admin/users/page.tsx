import type { Metadata } from "next";
import { getAllUsers } from "@/server/queries/admin";
import { requireRole } from "@/server/auth";
import { RoleSelect } from "./role-select";

export const metadata: Metadata = { title: "Admin · Users" };

export default async function AdminUsersPage() {
  const session = await requireRole("ADMIN", "/admin/users");
  const users = await getAllUsers();
  const currentUserId = session.user.id;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-2xl font-bold">Users</h2>
        <p className="text-sm text-muted-foreground">
          {users.length.toLocaleString("en-KE")} accounts
        </p>
      </div>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {users.map((u) => (
          <li key={u.id} className="flex items-center gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{u.name ?? "—"}</span>
                {u.id === currentUserId && (
                  <span className="text-xs text-muted-foreground">(you)</span>
                )}
                {u.vendor && (
                  <span className="text-xs text-muted-foreground">
                    /{u.vendor.slug} · {u.vendor.status}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {u.email} · joined{" "}
                {u.createdAt.toLocaleDateString("en-KE", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
            <RoleSelect
              userId={u.id}
              currentRole={u.role}
              isSelf={u.id === currentUserId}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
