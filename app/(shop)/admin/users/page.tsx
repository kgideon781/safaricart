import type { Metadata } from "next";
import { getAllUsers } from "@/server/queries/admin";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Admin · Users" };

const roleClass: Record<string, string> = {
  CUSTOMER: "bg-muted text-muted-foreground",
  VENDOR: "bg-secondary text-secondary-foreground",
  ADMIN: "bg-primary text-primary-foreground",
};

export default async function AdminUsersPage() {
  const users = await getAllUsers();

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
          <li
            key={u.id}
            className="flex items-center gap-4 p-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{u.name ?? "—"}</span>
                <Badge className={roleClass[u.role] ?? roleClass.CUSTOMER}>
                  {u.role}
                </Badge>
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
          </li>
        ))}
      </ul>
    </div>
  );
}
