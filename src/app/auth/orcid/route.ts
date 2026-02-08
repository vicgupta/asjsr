import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.ORCID_CLIENT_ID;

  if (!clientId) {
    return NextResponse.json(
      { error: "ORCID not configured" },
      { status: 500 }
    );
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/orcid/callback`;
  const orcidUrl = `https://orcid.org/oauth/authorize?client_id=${clientId}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(orcidUrl);
}
