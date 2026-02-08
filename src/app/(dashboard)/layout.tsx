import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  } catch (e) {
    // redirect() throws a special Next.js error — rethrow it
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    // re-throw Next.js internal redirect
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

  // Profile missing (trigger hasn't run yet or was deleted) —
  // show a setup prompt instead of redirecting to /login (which causes a loop)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h1 className="text-2xl font-bold">Setting up your account</h1>
          <p className="text-muted-foreground">
            Your profile is being created. Please refresh the page in a moment.
            If this persists, try signing out and signing back in.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button>Refresh</Button>
            </Link>
            <Link href="/">
              <Button variant="outline">Go Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
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
