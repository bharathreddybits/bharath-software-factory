"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export type SignUpActionState =
  | { error: string; message?: never }
  | { message: string; error?: never }
  | null;

export async function signUpAction(
  _prevState: SignUpActionState,
  formData: FormData
): Promise<SignUpActionState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return { error: error.message };
  }

  // Email confirmation is required when session is null after sign-up
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then sign in.",
    };
  }

  redirect("/onboarding");
}
