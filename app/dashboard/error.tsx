"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-full min-h-[400px] items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h1 className="text-xl font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-400">
          This page encountered an error. Try again or return to the overview.
        </p>
        {error.digest && <p className="mt-1 text-xs text-zinc-600">Error ID: {error.digest}</p>}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={reset} variant="outline" size="sm">
            Try again
          </Button>
          <Button size="sm">
            <Link href="/dashboard">Back to overview</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
