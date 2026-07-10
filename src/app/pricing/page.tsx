import { hasEntitlement } from "@/lib/entitlements";
import PricingCard from "@/components/PricingCard";
import AlreadyEntitled from "@/components/AlreadyEntitled";

export const dynamic = "force-dynamic";

// Server component: entitled users don't need the pitch — confirm their access
// and bounce them to the dashboard. Everyone else sees the purchase card.
export default async function PricingPage() {
  if (await hasEntitlement()) return <AlreadyEntitled />;
  return <PricingCard />;
}
