import { FlowChrome } from "@/components/site/FlowChrome";

export const revalidate = 300;

/**
 * Checking a booking gets the same chrome as making one. It was under the
 * public layout, so following "Check a booking" out of the stripped booking
 * page dropped the reader back into the full site — masthead, navigation,
 * footer columns, white ground — which read as having left the hospital's
 * booking system rather than moved one step inside it.
 */
export default function AppointmentLayout({ children }: { children: React.ReactNode }) {
  return <FlowChrome>{children}</FlowChrome>;
}
