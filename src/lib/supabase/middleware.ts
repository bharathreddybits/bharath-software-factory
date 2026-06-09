import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function createMiddlewareClient(request: NextRequest) {
  // Start with a pass-through response; the setAll handler will replace it
  // whenever Supabase needs to write refreshed session cookies.
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Mirror cookies onto both the mutated request and the response so
          // all downstream server components see the refreshed tokens.
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() must be called here (not getSession()) — it validates
  // the JWT against the auth server and refreshes the session if needed.
  // Do NOT add any logic between createServerClient and this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, response, user };
}
