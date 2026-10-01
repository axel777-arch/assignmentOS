"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function SearchBar({ onSearch, loading }: { onSearch: (query: string) => void; loading: boolean }) {
  const [query, setQuery] = useState("");
  return <form className="research-search" onSubmit={(event) => { event.preventDefault(); onSearch(query.trim()); }}><label className="sr-only" htmlFor="research-query">Search course materials</label><Search size={16} /><input id="research-query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your PDFs by topic" /><Button variant="primary" type="submit" disabled={loading || !query.trim()}>{loading ? "Searching" : "Search"}</Button></form>;
}
