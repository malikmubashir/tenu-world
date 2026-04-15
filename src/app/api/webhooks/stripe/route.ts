import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/payments/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event;
  try {
    event = await verifyWebhookSignature(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const metadata = session.metadata as {
      inspectionId?: string;
      userId?: string;
      product?: string;
    } | null;

    if (!metadata?.inspectionId || !metadata?.product) {
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = await createClient();

    if (metadata.product === "scan") {
      // Unlock the scan: update payment ID
      await supabase
        .from("inspections")
        .update({
          stripe_payment_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", metadata.inspectionId);
    } else if (metadata.product === "dispute") {
      // Unlock dispute letter generation
      await supabase
        .from("inspections")
        .update({
          dispute_purchased: true,
          stripe_payment_id: session.id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", metadata.inspectionId);
    }
  }

  return NextResponse.json({ received: true });
}
