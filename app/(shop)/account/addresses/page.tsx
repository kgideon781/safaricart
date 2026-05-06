import Link from "next/link";
import type { Metadata } from "next";
import { MapPin, Plus, Star, Trash2 } from "lucide-react";
import { requireSession } from "@/server/auth";
import { getUserAddresses } from "@/server/queries/account";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatKenyanPhone } from "@/lib/kenya";
import {
  deleteAddressAction,
  setDefaultAddressAction,
} from "@/server/actions/account";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await requireSession("/account/addresses");
  const addresses = await getUserAddresses(session.user.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Saved addresses</h2>
          <p className="text-sm text-muted-foreground">
            Used at checkout to ship across all 47 counties.
          </p>
        </div>
        <Link
          href="/account/addresses/new"
          className={buttonVariants({ size: "sm" })}
        >
          <Plus className="size-4" />
          Add address
        </Link>
      </div>

      {addresses.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card p-10 text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-muted">
            <MapPin className="size-6 text-muted-foreground" />
          </div>
          <h3 className="mt-3 font-heading text-lg font-semibold">
            No addresses yet
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a delivery address to speed up checkout.
          </p>
          <Link
            href="/account/addresses/new"
            className={`${buttonVariants({ size: "sm" })} mt-4`}
          >
            Add your first address
          </Link>
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {addresses.map((addr) => (
            <li
              key={addr.id}
              className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  {addr.label && (
                    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      {addr.label}
                    </span>
                  )}
                  <p className="font-medium">{addr.recipientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatKenyanPhone(addr.recipientPhone)}
                  </p>
                </div>
                {addr.isDefault && (
                  <Badge className="bg-secondary text-secondary-foreground">
                    Default
                  </Badge>
                )}
              </div>

              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p>{addr.streetAddress}</p>
                  <p>
                    {[addr.ward, addr.subCounty, addr.county]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                  {addr.landmark && (
                    <p className="italic">Landmark: {addr.landmark}</p>
                  )}
                </div>
              </div>

              <div className="mt-auto flex gap-2 pt-2">
                {!addr.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={addr.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Star className="size-3.5" />
                      Set as default
                    </button>
                  </form>
                )}
                <form action={deleteAddressAction} className="ml-auto">
                  <input type="hidden" name="id" value={addr.id} />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
