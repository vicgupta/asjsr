import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export async function PublicHeader() {
  let journalName = "Academic Journal";
  let user = null;

  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("journal_settings")
      .select("journal_name")
      .single();
    if (data) journalName = data.journal_name;

    const { data: authData } = await supabase.auth.getUser();
    user = authData.user;
  } catch {
    // Supabase not available — render with defaults
  }

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold">
            {journalName}
          </Link>
          <nav className="hidden md:flex items-center gap-4 text-sm">
            <Link
              href="/archive"
              className="text-muted-foreground hover:text-foreground"
            >
              Archive
            </Link>
            <Link
              href="/search"
              className="text-muted-foreground hover:text-foreground"
            >
              Search
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm">Register</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
