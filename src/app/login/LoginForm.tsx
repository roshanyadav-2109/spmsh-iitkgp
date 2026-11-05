"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { createBrowserSupabase } from "@/lib/supabase/browser";

/** Local-preview demo accounts; they exist only in the sample-data server. */
const DEMO_ACCOUNTS = [
  { label: "Reception", email: "reception@demo.local" },
  { label: "Doctor", email: "doctor@demo.local" },
  { label: "Admin", email: "admin@demo.local" },
];
const DEMO_PASSWORD = "demo1234";

export function LoginForm({
  nextPath,
  demo = false,
}: {
  nextPath: string | null;
  /** Show one-click demo sign-in. Only ever true in the local preview. */
  demo?: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    await signIn(email.trim(), password);
  };

  const signIn = async (userId: string, secret: string) => {
    setBusy(true);
    setError(null);

    const supabase = createBrowserSupabase();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: userId,
      password: secret,
    });

    if (signInError || !data.user) {
      setBusy(false);
      // Deliberately the same sentence for an unknown address and a wrong
      // password, so the form cannot be used to discover who has an account.
      setError("That user id and password do not match. Check both and try again.");
      window.setTimeout(() => errorRef.current?.focus(), 0);
      return;
    }

    // A row must exist and be active. An auth user without an active profile is
    // signed straight back out.
    const { data: profile } = await supabase
      .from("staff_profiles")
      .select("role, is_active")
      .eq("id", data.user.id)
      .maybeSingle();

    if (!profile || !profile.is_active) {
      await supabase.auth.signOut();
      setBusy(false);
      setError("This account is disabled. Contact technical support.");
      window.setTimeout(() => errorRef.current?.focus(), 0);
      return;
    }

    const destination =
      nextPath && nextPath.startsWith("/portal")
        ? nextPath
        : profile.role === "tech"
          ? "/portal/admin"
          : profile.role === "reception"
            ? "/portal/reception"
            : "/portal/doctor";

    router.replace(destination);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      {error ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          data-focus-target="true"
          role="alert"
          className="rounded-md border border-emergency p-4 text-15 text-emergency"
        >
          {error}
        </div>
      ) : null}

      <Field id="email" label="User id" hint="The email address issued to you.">
        {(control) => (
          <Input
            {...control}
            type="email"
            value={email}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            required
            onChange={(e) => setEmail(e.target.value)}
          />
        )}
      </Field>

      <Field id="password" label="Password">
        {(control) => (
          <Input
            {...control}
            type="password"
            value={password}
            autoComplete="current-password"
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        )}
      </Field>

      <button
        type="submit"
        disabled={busy}
        className="ui-transition inline-flex h-12 w-full items-center justify-center rounded-md bg-bar px-6 text-16 font-medium text-white hover:bg-bar-deep disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>

      {demo ? (
        <div className="rounded-lg bg-tint-neutral p-5">
          <p className="text-15 font-medium text-ink">Demo login</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {DEMO_ACCOUNTS.map((account) => (
              <button
                key={account.email}
                type="button"
                disabled={busy}
                onClick={() => {
                  setEmail(account.email);
                  setPassword(DEMO_PASSWORD);
                  void signIn(account.email, DEMO_PASSWORD);
                }}
                className="ui-transition h-11 rounded-md border border-line-strong bg-white px-3 text-15 font-medium text-ink hover:border-ink disabled:opacity-60"
              >
                {account.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </form>
  );
}
