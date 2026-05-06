import { Button } from "@/components/ui/button";
import {
  FacebookIcon,
  GithubIcon,
  GoogleIcon,
} from "@/components/auth/provider-icons";
import {
  facebookLoginAction,
  githubLoginAction,
  googleLoginAction,
} from "@/server/actions/auth";

export type EnabledProviders = {
  google: boolean;
  facebook: boolean;
  github: boolean;
};

export function ProviderButtons({ enabled }: { enabled: EnabledProviders }) {
  const hasAny = enabled.google || enabled.facebook || enabled.github;
  if (!hasAny) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {enabled.google && (
          <form action={googleLoginAction}>
            <Button type="submit" variant="outline" className="w-full">
              <GoogleIcon className="size-4" />
              Continue with Google
            </Button>
          </form>
        )}
        {enabled.facebook && (
          <form action={facebookLoginAction}>
            <Button type="submit" variant="outline" className="w-full">
              <FacebookIcon className="size-4" />
              Continue with Facebook
            </Button>
          </form>
        )}
        {enabled.github && (
          <form action={githubLoginAction}>
            <Button type="submit" variant="outline" className="w-full">
              <GithubIcon className="size-4" />
              Continue with GitHub
            </Button>
          </form>
        )}
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        <span>or with email</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
