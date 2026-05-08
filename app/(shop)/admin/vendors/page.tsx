import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { getAllVendors } from "@/server/queries/admin";
import {
  approveVendorAction,
  suspendVendorAction,
  reactivateVendorAction,
  reviewVendorDocumentAction,
  createVendorPayoutAction,
} from "@/server/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatKES } from "@/lib/kenya";

export const metadata: Metadata = { title: "Admin · Vendors" };

const statusVariant = {
  PENDING: { label: "Pending", className: "bg-accent text-accent-foreground" },
  APPROVED: { label: "Approved", className: "bg-secondary text-secondary-foreground" },
  SUSPENDED: { label: "Suspended", className: "bg-destructive text-destructive-foreground" },
} as const;

const docStatusVariant = {
  PENDING: "bg-accent text-accent-foreground",
  APPROVED: "bg-secondary text-secondary-foreground",
  REJECTED: "bg-destructive text-destructive-foreground",
} as const;

export default async function AdminVendorsPage() {
  const vendors = await getAllVendors();

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-heading text-2xl font-bold">Vendors</h2>

      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-card">
        {vendors.map((v) => {
          const status = statusVariant[v.status];
          const defaultDestination =
            v.mpesaPaybill ||
            v.mpesaTillNumber ||
            (v.bankName && v.bankAccountNumber
              ? `${v.bankName} ${v.bankAccountNumber}`
              : "");
          return (
            <li key={v.id} className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-start gap-3 md:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{v.name}</span>
                    <Badge className={status.className}>{status.label}</Badge>
                    <Link
                      href={`/vendor/${v.slug}`}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      /{v.slug} <ExternalLink className="inline size-3" />
                    </Link>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {v.user.email} · {v.county} · {v._count.products} product
                    {v._count.products === 1 ? "" : "s"} · {v.contactPhone}
                  </p>
                  {v.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {v.description}
                    </p>
                  )}
                  <p className="mt-1 text-xs">
                    <span className="text-muted-foreground">Unpaid balance: </span>
                    <span className="font-medium">{formatKES(v.payableKes)}</span>
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {v.status === "PENDING" && (
                    <form action={approveVendorAction}>
                      <input type="hidden" name="id" value={v.id} />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
                  )}
                  {v.status === "APPROVED" && (
                    <form action={suspendVendorAction} className="flex items-center gap-1">
                      <input type="hidden" name="id" value={v.id} />
                      <Input name="notes" placeholder="Reason" className="h-8 w-full text-xs sm:w-32" />
                      <Button type="submit" size="sm" variant="destructive">
                        Suspend
                      </Button>
                    </form>
                  )}
                  {v.status === "SUSPENDED" && (
                    <form action={reactivateVendorAction}>
                      <input type="hidden" name="id" value={v.id} />
                      <Button type="submit" size="sm">
                        Reactivate
                      </Button>
                    </form>
                  )}
                </div>
              </div>

              {v.documents.length > 0 && (
                <details className="rounded-md border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    KYC documents ({v.documents.length})
                  </summary>
                  <ul className="mt-2 flex flex-col gap-2">
                    {v.documents.map((d) => (
                      <li
                        key={d.id}
                        className="flex flex-wrap items-center gap-2 rounded border border-border bg-muted/30 p-2 text-xs"
                      >
                        <Badge className={docStatusVariant[d.status]}>{d.status}</Badge>
                        <span className="font-medium">{d.type.replace(/_/g, " ")}</span>
                        <a
                          href={d.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          View file <ExternalLink className="inline size-3" />
                        </a>
                        {d.status === "PENDING" && (
                          <div className="ml-auto flex gap-1">
                            <form action={reviewVendorDocumentAction}>
                              <input type="hidden" name="id" value={d.id} />
                              <input type="hidden" name="decision" value="APPROVED" />
                              <Button type="submit" size="sm" variant="outline">
                                Approve
                              </Button>
                            </form>
                            <form action={reviewVendorDocumentAction} className="flex gap-1">
                              <input type="hidden" name="id" value={d.id} />
                              <input type="hidden" name="decision" value="REJECTED" />
                              <Input
                                name="notes"
                                placeholder="Reason"
                                className="h-7 w-28 text-xs"
                              />
                              <Button type="submit" size="sm" variant="ghost">
                                Reject
                              </Button>
                            </form>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </details>
              )}

              {v.payableKes > 0 && (
                <details className="rounded-md border border-border p-3">
                  <summary className="cursor-pointer text-sm font-medium">
                    Record a payout — {formatKES(v.payableKes)} owed
                  </summary>
                  <form
                    action={createVendorPayoutAction}
                    className="mt-2 flex flex-wrap gap-2"
                  >
                    <input type="hidden" name="vendorId" value={v.id} />
                    <select
                      name="method"
                      className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                      defaultValue={v.mpesaPaybill || v.mpesaTillNumber ? "MPESA" : "BANK"}
                    >
                      <option value="MPESA">M-Pesa</option>
                      <option value="BANK">Bank</option>
                    </select>
                    <Input
                      name="destinationLabel"
                      placeholder="Destination (e.g. Paybill 522522 acct 123)"
                      defaultValue={defaultDestination}
                      className="h-8 w-full text-xs sm:min-w-64 sm:flex-1"
                      required
                    />
                    <Input
                      name="reference"
                      placeholder="Bank/M-Pesa ref"
                      className="h-8 w-full text-xs sm:w-40"
                    />
                    <Button type="submit" size="sm">
                      Record payout
                    </Button>
                  </form>
                </details>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
