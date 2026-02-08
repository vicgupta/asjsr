"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface SidebarProps {
  roles: UserRole[];
  fullName: string;
  email: string;
}

interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "My Submissions", href: "/dashboard/submissions", roles: ["author"] },
  { label: "New Submission", href: "/dashboard/submissions/new", roles: ["author"] },
  { label: "My Reviews", href: "/dashboard/reviews", roles: ["reviewer"] },
  { label: "Editor Panel", href: "/dashboard/editor", roles: ["editor"] },
  { label: "CMS Pages", href: "/dashboard/editor/cms", roles: ["editor"] },
  { label: "Settings", href: "/dashboard/editor/settings", roles: ["editor"] },
  { label: "Notifications", href: "/dashboard/notifications" },
  { label: "Profile", href: "/dashboard/profile" },
];

export function DashboardSidebar({ roles, fullName, email }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.some((r) => roles.includes(r))
  );

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 border-r bg-card min-h-screen flex flex-col">
      <div className="p-4">
        <Link href="/" className="text-lg font-semibold">
          ASJSR
        </Link>
      </div>
      <Separator />
      <nav className="flex-1 p-3 space-y-1">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-3 py-2 rounded-md text-sm transition-colors",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="p-4 space-y-3">
        <div className="text-sm">
          <p className="font-medium truncate">{fullName || "User"}</p>
          <p className="text-muted-foreground truncate">{email}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </div>
    </aside>
  );
}
