import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    const loginUrl = new URL("/login", new URL(request.url).origin);
    loginUrl.searchParams.set("next", "/api/checkout");
    return NextResponse.redirect(loginUrl);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  try {
    // LemonSqueezy Checkout API — like Stripe's session.create but REST/JSON:API format.
    // We pass user_id in custom_data so the webhook can update the right profile row.
    const res = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY!}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "checkouts",
          attributes: {
            checkout_data: {
              email: user.email,
              custom: {
                user_id: user.id,  // Supabase UUID — echoed back in the webhook payload
              },
            },
            product_options: {
              redirect_url: `${siteUrl}/dashboard?paid=true`,
            },
          },
          relationships: {
            store: {
              data: { type: "stores", id: process.env.LEMONSQUEEZY_STORE_ID! },
            },
            variant: {
              data: { type: "variants", id: process.env.LEMONSQUEEZY_VARIANT_ID! },
            },
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[checkout] LemonSqueezy API error:", res.status, body);
      return NextResponse.json({ error: "Could not create checkout session." }, { status: 500 });
    }

    const json = await res.json();
    const checkoutUrl: string | undefined = json.data?.attributes?.url;

    if (!checkoutUrl) {
      console.error("[checkout] No URL in LemonSqueezy response:", json);
      return NextResponse.json({ error: "No checkout URL returned." }, { status: 500 });
    }

    return NextResponse.redirect(checkoutUrl);
  } catch (err) {
    console.error("[checkout] Unexpected error:", err);
    return NextResponse.json({ error: "Checkout failed." }, { status: 500 });
  }
}
