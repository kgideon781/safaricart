import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers",
  description: "Join the team building Kenya's online marketplace.",
};

export default function CareersPage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 md:px-6">
      <h1 className="font-heading text-4xl font-bold tracking-tight">Careers</h1>
      <p className="mt-4 text-lg text-muted-foreground">
        We&apos;re a small team in Nairobi building Kenya&apos;s online
        marketplace. Roles open up as we grow.
      </p>

      <div className="mt-10 rounded-lg border border-border bg-card p-6">
        <h2 className="font-heading text-xl font-semibold">No openings right now</h2>
        <p className="mt-2 text-muted-foreground">
          We&apos;re not actively hiring at the moment, but we&apos;re always
          interested in talking to product engineers, designers, and operations
          folk who love East African commerce.
        </p>
        <p className="mt-4">
          Send a short note about yourself and what you&apos;d like to work on
          to{" "}
          <a
            href="mailto:careers@safaricart.co.ke"
            className="text-primary underline-offset-2 hover:underline"
          >
            careers@safaricart.co.ke
          </a>
          . We read every email.
        </p>
      </div>
    </article>
  );
}
