import type { Metadata } from "next";
import { requireSession } from "@/server/auth";
import { getUserProfile } from "@/server/queries/account";
import { ProfileForm } from "./profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Profile" };

export default async function AccountPage() {
  const session = await requireSession("/account");
  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    throw new Error("Profile not found");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Profile</CardTitle>
        <CardDescription>
          Update your name and phone number. Email is locked for security.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ProfileForm
          email={profile.email}
          name={profile.name ?? ""}
          phone={profile.phone ?? ""}
        />
      </CardContent>
    </Card>
  );
}
