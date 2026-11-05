import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Staff login",
  description: "Sign in to the staff portal.",
  robots: { index: false, follow: false },
};

const REASONS: Record<string, string> = {
  expired: "The session has expired after 12 hours. Sign in again.",
  disabled: "This account is disabled. Contact technical support.",
};

/**
 * Demo sign-in buttons show only when NEXT_PUBLIC_DEMO_LOGIN=1. The owner
 * chose to turn this on for the live site too, knowing it gives anyone staff
 * access; the demo accounts are reception@, doctor@ and admin@demo.local.
 * Build without the flag to remove the buttons.
 */
const DEMO_ENABLED = process.env.NEXT_PUBLIC_DEMO_LOGIN === "1";

const PORTALS = [
  { title: "Reception", text: "Today's list, counter booking, schedules and notices" },
  { title: "Doctor", text: "Your own OPD list and weekly schedule" },
  { title: "Admin", text: "Staff accounts, site settings and the audit log" },
];

type Props = { searchParams: Promise<{ next?: string; reason?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next, reason } = await searchParams;

  return (
    <div className="page-width py-8 lg:py-12">
      <div className="grid overflow-hidden rounded-lg border border-line lg:grid-cols-2">
        {/* Left: the hospital, and what the portal is for. */}
        <div
          data-surface="dark"
          className="relative flex min-h-72 flex-col justify-end overflow-hidden bg-bar p-6 text-white sm:p-10 lg:min-h-[36rem]"
        >
          <Image
            src="/images/hospital-building.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-top opacity-20"
          />
          <div className="relative">
            <p className="text-14 font-medium text-white">Staff portal</p>
            <h2 className="mt-2 text-32 tracking-tightest text-white lg:text-40 lg:tracking-display">
              Dr. Syama Prasad Mookerjee Superspeciality Hospital
            </h2>
            <ul className="mt-8 grid gap-4">
              {PORTALS.map((portal) => (
                <li key={portal.title} className="border-l-2 border-white pl-4">
                  <p className="text-16 font-medium text-white">{portal.title}</p>
                  <p className="mt-0.5 text-14 text-white">{portal.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right: the form. */}
        <div className="flex flex-col justify-center bg-white p-6 sm:p-10 lg:p-14">
          <p className="text-14 font-medium text-ink">Staff only</p>
          <h1 className="mt-1 text-32 tracking-tightest">Sign in</h1>
          <p className="mt-2 text-15 text-body">
            Use the email address and password issued to you.
          </p>

          {reason && REASONS[reason] ? (
            <p
              role="status"
              className="mt-6 rounded-md border border-emergency p-4 text-15 text-emergency"
            >
              {REASONS[reason]}
            </p>
          ) : null}

          <div className="mt-8">
            <LoginForm nextPath={next ?? null} demo={DEMO_ENABLED} />
          </div>

          <p className="mt-8 border-t border-line pt-5 text-14 text-muted">
            Trouble signing in? Contact technical support.{" "}
            <Link href="/book" className="text-ink">
              Patient? Book an appointment
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
