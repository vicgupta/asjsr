import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${origin}/login?error=orcid_failed`);
  }

  try {
    // Exchange code for token
    const tokenRes = await fetch("https://orcid.org/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.ORCID_CLIENT_ID!,
        client_secret: process.env.ORCID_CLIENT_SECRET!,
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/orcid/callback`,
      }),
    });

    if (!tokenRes.ok) {
      return NextResponse.redirect(`${origin}/login?error=orcid_token_failed`);
    }

    const tokenData = await tokenRes.json();
    const orcidId = tokenData.orcid;
    const name = tokenData.name;

    if (!orcidId) {
      return NextResponse.redirect(`${origin}/login?error=orcid_no_id`);
    }

    const supabase = await createClient();

    // Check if user is already logged in (linking flow)
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      // Link ORCID to existing profile
      const adminClient = createAdminClient();
      await adminClient
        .from("profiles")
        .update({ orcid_id: orcidId })
        .eq("id", currentUser.id);

      return NextResponse.redirect(`${origin}/dashboard/profile`);
    }

    // Check if profile with this ORCID exists
    const adminClient = createAdminClient();
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, email")
      .eq("orcid_id", orcidId)
      .single();

    if (existingProfile) {
      // Sign in existing user via magic link
      await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: existingProfile.email,
      });

      // For now, redirect to login with message
      return NextResponse.redirect(
        `${origin}/login?message=orcid_found&email=${encodeURIComponent(existingProfile.email)}`
      );
    }

    // New user - create account with ORCID
    const email = `orcid-${orcidId}@placeholder.local`;
    const { data: newUser, error: createError } =
      await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name: name || "", orcid_id: orcidId },
      });

    if (createError || !newUser.user) {
      return NextResponse.redirect(`${origin}/login?error=orcid_create_failed`);
    }

    // Update profile with ORCID
    await adminClient
      .from("profiles")
      .update({ orcid_id: orcidId, full_name: name || "" })
      .eq("id", newUser.user.id);

    // Generate sign-in link
    const { data: linkData } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkData?.properties?.hashed_token) {
      return NextResponse.redirect(
        `${origin}/auth/callback?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/dashboard/profile`
      );
    }

    return NextResponse.redirect(`${origin}/login?message=account_created`);
  } catch (err) {
    console.error("ORCID callback error:", err);
    return NextResponse.redirect(`${origin}/login?error=orcid_error`);
  }
}
