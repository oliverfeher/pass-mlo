import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";

// Creates a one-time Stripe Checkout session for the signed-in user.
// The user's id is passed as client_reference_id so the webhook can grant
// the entitlement to the right account.
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const origin = req.headers.get("origin") ?? "http://localhost:3000";

  const checkout = await stripe.checkout.sessions.create({
    mode: "payment", // one-time purchase
    line_items: [{ price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!, quantity: 1 }],
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    success_url: `${origin}/practice?purchased=1`,
    cancel_url: `${origin}/pricing`,
  });

  return NextResponse.json({ url: checkout.url });
}
