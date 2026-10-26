import { ShieldOff } from "lucide-react";
import { ButtonLink, Page } from "@/components/ui";

interface NoAccessProps {
  description?: string;
}

export default function NoAccess({
  description = "Your account can't open this page. If you need it, ask your school administrator.",
}: NoAccessProps) {
  return (
    <Page>
      <section role="alert" aria-labelledby="no-access-title" className="max-w-xl">
        <ShieldOff className="h-6 w-6 text-muted" aria-hidden="true" />
        <h1 id="no-access-title" className="mt-3 text-display font-semibold text-ink">
          No access
        </h1>
        <p className="mt-2 text-body-lg text-muted">{description}</p>
        <ButtonLink href="/overview" variant="primary" className="mt-6">
          Go to Overview
        </ButtonLink>
      </section>
    </Page>
  );
}
