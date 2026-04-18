"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/**
 * Server Action — sign out the current user and redirect home.
 *
 * Bound directly to the <form> in UserMenu so the browser POSTs the
 * sign-out through Next's action pipeline. CSRF-safe by construction
 * (server actions carry an action id signed with the build-time secret).
 */
export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
