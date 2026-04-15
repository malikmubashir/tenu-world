import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession, type Product } from "@/lib/payments/stripe";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { product, inspectionId, successUrl, cancelUrl } = body as {
    product: Product;
    inspectionId: string;
    successUrl: string;
    cancelUrl: string;
  };

  if (!product || !inspectionId || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // verify ownership
  const { data: inspection } = await supabase
    .from("inspections")
    .select("id, user_id")
    .eq("id", inspectionId)
    .single();

  if (!inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await createCheckoutSession({
    product,
    inspectionId,
    userId: user.id,
    userEmail: user.email ?? "",
    successUrl,
    cancelUrl,
  });

  return NextResponse.json({ sessionId: session.sessionId, url: session.url });
}
