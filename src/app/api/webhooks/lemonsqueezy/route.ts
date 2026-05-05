import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ─── Supabase admin client ────────────────────────────────────────────────────
// Uses the service_role key — bypasses RLS, server-only. Like a Django superuser DB connection.
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ─── Signature verification ───────────────────────────────────────────────────
// LemonSqueezy signs every webhook with HMAC-SHA256 and sends it in X-Signature.
// Like Flask's itsdangerous.TimestampSigner — proves the payload came from LS, not an attacker.
function verifySignature(rawBody: string, signature: string): boolean {
  const hmac = crypto.createHmac("sha256", process.env.LEMON_SQUEEZY_WEBHOOK_SECRET!);
  const digest = hmac.update(rawBody).digest("hex");
  try {
    // timingSafeEqual prevents timing attacks — never use === for HMAC comparison.
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  // 1. Read raw body before any parsing (same reason as Stripe — signature is over the raw bytes).
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!signature) {
    console.error("[ls-webhook] Missing X-Signature header");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // 2. Verify the signature.
  if (!verifySignature(rawBody, signature)) {
    console.error("[ls-webhook] Invalid signature — possible spoofed request");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // 3. Parse the verified payload.
  // LemonSqueezy sends a JSON body with meta.event_name and data.attributes.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload = JSON.parse(rawBody) as Record<string, any>;
  const eventName: string = payload?.meta?.event_name ?? "";

  console.log("[ls-webhook] Received event:", eventName);

  // 4. Handle the events we care about.
  // order_created     = one-time purchase completed
  // subscription_created = new subscription activated
  if (eventName === "order_created" || eventName === "subscription_created") {

    // user_id is the Supabase UUID we injected at checkout creation via checkout_data.custom.
    const userId: string | undefined = payload?.meta?.custom_data?.user_id;
    // customer email as a fallback — present on all LS events.
    const customerEmail: string | undefined =
      payload?.data?.attributes?.user_email ??
      payload?.data?.attributes?.customer_email;

    const admin = getSupabaseAdmin();

    if (userId) {
      // ── Primary path: update by UUID ────────────────────────────────────────
      const { error } = await admin
        .from("profiles")
        .upsert({
          id: userId,
          is_pro: true,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("[ls-webhook] DB upsert failed for user_id:", userId, error);
        // Return 500 so LemonSqueezy retries the delivery.
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      console.log(`[ls-webhook] Pro unlocked for user ${userId} (${eventName})`);

    } else if (customerEmail) {
      // ── Fallback path: look up user by email ────────────────────────────────
      // Used when the checkout wasn't created through our /api/checkout route
      // (e.g. direct storefront purchase without custom_data).
      const { data: listData, error: listError } = await admin.auth.admin.listUsers({
        perPage: 1000,
      });

      if (listError) {
        console.error("[ls-webhook] User list failed:", listError);
        return NextResponse.json({ error: "User lookup failed" }, { status: 500 });
      }

      const match = listData?.users?.find((u) => u.email === customerEmail);

      if (!match) {
        console.error("[ls-webhook] No user found for email:", customerEmail);
        // Return 200 — retrying won't help if the user genuinely doesn't exist.
        return NextResponse.json({ received: true });
      }

      const { error } = await admin
        .from("profiles")
        .upsert({
          id: match.id,
          is_pro: true,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error("[ls-webhook] DB upsert failed for email:", customerEmail, error);
        return NextResponse.json({ error: "Database update failed" }, { status: 500 });
      }

      console.log(`[ls-webhook] Pro unlocked for ${customerEmail} via email fallback (${eventName})`);

    } else {
      console.error("[ls-webhook] No user_id or email in payload for event:", eventName);
    }
  }

  // Return 200 for all other events so LemonSqueezy stops retrying them.
  return NextResponse.json({ received: true });
}
