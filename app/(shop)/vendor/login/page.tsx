import { redirect } from "next/navigation";

// Vendor sign-in is just regular sign-in — there's no separate vendor portal.
// This route exists so the footer's "Vendor sign-in" link doesn't 404.
export default function VendorLoginPage() {
  redirect("/login?callbackUrl=/vendor/dashboard");
}
