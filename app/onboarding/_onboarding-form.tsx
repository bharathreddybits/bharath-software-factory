"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createOrganizationAction } from "./actions";

export function OnboardingForm() {
  const [state, formAction, pending] = useActionState(createOrganizationAction, null);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center size-12 rounded-2xl bg-zinc-800 text-2xl mb-2">
            🏢
          </div>
          <h1 className="text-2xl font-semibold text-white">Create your organization</h1>
          <p className="text-sm text-zinc-400">Set up your workspace to get started</p>
        </div>

        {/* Form */}
        <form action={formAction} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-zinc-300">
              Organization name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              placeholder="Acme Corp"
              autoFocus
              className="h-10 bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-600 focus-visible:border-zinc-500"
            />
            <p className="text-xs text-zinc-600">
              This is your team&apos;s display name — you can change it later.
            </p>
          </div>

          {state?.error && (
            <p className="text-sm text-red-400 bg-red-950/40 border border-red-900/50 rounded-lg px-3 py-2">
              {state.error}
            </p>
          )}

          <Button
            type="submit"
            disabled={pending}
            className="w-full h-10 bg-white text-zinc-900 hover:bg-zinc-100 font-medium"
          >
            {pending ? "Creating workspace…" : "Continue"}
          </Button>
        </form>
      </div>
    </div>
  );
}
