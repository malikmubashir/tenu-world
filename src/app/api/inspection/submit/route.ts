import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inspectionId } = (await request.json()) as { inspectionId: string };

  // verify ownership
  const { data: inspection } = await supabase
    .from("inspections")
    .select("id, user_id, status")
    .eq("id", inspectionId)
    .single();

  if (!inspection || inspection.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (inspection.status !== "capturing") {
    return NextResponse.json({ error: "Inspection already submitted" }, { status: 400 });
  }

  // check at least one photo exists
  const { count } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .in(
      "room_id",
      (await supabase.from("rooms").select("id").eq("inspection_id", inspectionId)).data?.map((r: { id: string }) => r.id) ?? [],
    );

  if (!count || count === 0) {
    return NextResponse.json({ error: "No photos captured. Add at least one photo before submitting." }, { status: 400 });
  }

  // mark as submitted
  const { error: updateError } = await supabase
    .from("inspections")
    .update({ status: "submitted", updated_at: new Date().toISOString() })
    .eq("id", inspectionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ status: "submitted", inspectionId });
}
