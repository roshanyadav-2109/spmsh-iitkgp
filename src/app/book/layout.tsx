import { FlowChrome } from "@/components/site/FlowChrome";

export const revalidate = 300;

export default function BookLayout({ children }: { children: React.ReactNode }) {
  return <FlowChrome>{children}</FlowChrome>;
}
