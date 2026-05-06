import Link from "next/link";
import { ArrowRight, Truck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 md:grid-cols-2 md:px-6 md:py-20">
        <div className="flex flex-col justify-center">
          <span className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
            <Truck className="size-3.5" />
            Free delivery on orders over KES 5,000
          </span>

          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Shop the <span className="text-primary">journey</span>.
          </h1>
          <p className="mt-3 font-heading text-lg italic text-muted-foreground md:text-xl">
            Safari yako ya ununuzi.
          </p>
          <p className="mt-6 max-w-lg text-base text-muted-foreground md:text-lg">
            Discover thousands of products from trusted Kenyan vendors. Pay with
            M-Pesa, ship to all 47 counties — fast, fair, and verified.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/deals"
              className={buttonVariants({ size: "lg" })}
            >
              Shop today's deals
              <ArrowRight className="ml-1 size-4" />
            </Link>
            <Link
              href="/vendor/register"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              Sell with us
            </Link>
          </div>
        </div>

        <div className="relative hidden md:block">
          <div className="absolute -right-8 -top-8 size-72 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-0 left-0 size-64 rounded-full bg-secondary/20 blur-3xl" />
          <div className="relative grid h-full grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <div className="flex-1 rounded-2xl bg-[url('https://picsum.photos/seed/sc-hero-1/600/600')] bg-cover bg-center shadow-lg" />
              <div className="h-32 rounded-2xl bg-[url('https://picsum.photos/seed/sc-hero-2/600/400')] bg-cover bg-center shadow-lg" />
            </div>
            <div className="flex flex-col gap-4 pt-12">
              <div className="h-32 rounded-2xl bg-[url('https://picsum.photos/seed/sc-hero-3/600/400')] bg-cover bg-center shadow-lg" />
              <div className="flex-1 rounded-2xl bg-[url('https://picsum.photos/seed/sc-hero-4/600/600')] bg-cover bg-center shadow-lg" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
