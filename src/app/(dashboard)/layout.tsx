import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardHeader } from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let user;
  let profile;

  try {
    const supabase = await createClient();
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      redirect("/login");
    }

    user = authData.user;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    profile = profileData;

    // Auto-create profile if trigger didn't fire (migration not applied, etc.)
    if (!profile) {
      const admin = createAdminClient();
      const { data: created } = await admin
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email ?? "",
          full_name:
            user.user_metadata?.full_name ??
            user.user_metadata?.name ??
            "",
        })
        .select()
        .single();
      profile = created;
    }
  } catch (e) {
    // redirect() throws a special Next.js error — rethrow it
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      typeof (e as any).digest === "string" &&
      (e as any).digest.startsWith("NEXT_REDIRECT")
    )
      throw e;

    // Supabase connection failed — show error state
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Unable to load dashboard</h1>
          <p className="text-muted-foreground">
            Could not connect to the database. Please check your configuration
            and try again.
          </p>
          <Link href="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!profile) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        roles={profile.roles}
        fullName={profile.full_name}
        email={profile.email}
      />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
