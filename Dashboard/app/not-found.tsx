import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="mt-2 text-sm text-muted-foreground">Page not found</p>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
