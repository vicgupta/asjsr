"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchForm({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search papers by title, abstract, keywords, or content..."
        className="flex-1"
      />
      <Button type="submit">Search</Button>
    </form>
  );
}
