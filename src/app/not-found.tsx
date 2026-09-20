import { Container, LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-24 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted">The college, branch or page you were looking for does not exist or has moved.</p>
      <div className="mt-6 flex justify-center gap-2">
        <LinkButton href="/colleges">Browse colleges</LinkButton>
        <LinkButton href="/" variant="outline">
          Home
        </LinkButton>
      </div>
    </Container>
  );
}
