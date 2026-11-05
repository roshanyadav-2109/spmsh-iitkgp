"use client";

import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      className="text-ink hover:underline"
      onClick={async () => {
        const supabase = createBrowserSupabase();
        await supabase.auth.signOut();
        router.replace("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
