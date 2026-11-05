"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Alt+B opens the counter booking screen from anywhere in the reception
 * portal. Alt+N and Alt+P are handled inside the booking screen itself, where
 * they have something to act on.
 */
export function ReceptionShortcuts() {
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === "b") {
        event.preventDefault();
        router.push("/portal/reception/book");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return null;
}
