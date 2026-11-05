import { FlowChrome } from "@/components/site/FlowChrome";

export const dynamic = "force-dynamic";

/**
 * Signing in gets the same chrome as booking and as looking a booking up.
 *
 * It used to take the public chrome — masthead, primary navigation, footer
 * link columns — which put seven ways to wander off on a page with one job,
 * and gave a sign-in form the same furniture as an article about the
 * hospital. The crest still has to be there: a page asking for a user id and
 * a password with no letterhead on it is indistinguishable from a phishing
 * form, which is the reason this file existed in the first place.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <FlowChrome>{children}</FlowChrome>;
}
