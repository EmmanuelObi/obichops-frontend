"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Search } from "lucide-react";

import type { ProxyStaffRecipient } from "@/types/proxy-order";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderStatusLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

interface StaffMemberSearchProps {
  staff: ProxyStaffRecipient[];
  selectedUserId: string;
  onSelect: (userId: string) => void;
  onClear: () => void;
}

function matchesQuery(member: ProxyStaffRecipient, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return (
    member.name.toLowerCase().includes(normalized) ||
    member.email.toLowerCase().includes(normalized)
  );
}

export function StaffMemberSearch({
  staff,
  selectedUserId,
  onSelect,
  onClear,
}: StaffMemberSearchProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selectedMember = useMemo(
    () => staff.find((member) => member.userId === selectedUserId) ?? null,
    [staff, selectedUserId],
  );

  const results = useMemo(
    () =>
      staff
        .filter((member) => matchesQuery(member, query))
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })),
    [staff, query],
  );

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  function handleSelect(member: ProxyStaffRecipient) {
    onSelect(member.userId);
    setQuery("");
    setOpen(false);
  }

  if (selectedMember) {
    return (
      <div className="space-y-2">
        <Label>Selected staff member</Label>
        <div className="flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Check className="size-4 shrink-0 text-success" />
              <p className="font-medium">{selectedMember.name}</p>
              {selectedMember.hasOrder && selectedMember.orderStatus ? (
                <Badge variant="secondary">
                  {orderStatusLabel(selectedMember.orderStatus)}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {selectedMember.email}
            </p>
            {selectedMember.hasOrder && selectedMember.orderStatus ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Already has a{" "}
                {orderStatusLabel(selectedMember.orderStatus).toLowerCase()} order
                this week — you can continue or update it.
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className="shrink-0 text-sm font-medium text-primary hover:underline"
            onClick={() => {
              onClear();
              setQuery("");
              setOpen(true);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-2">
      <Label htmlFor="staff-search">Find staff member</Label>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          id="staff-search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Type a name or email"
          className="pl-9"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="staff-search-results"
        />
      </div>

      {open ? (
        <div
          id="staff-search-results"
          role="listbox"
          className="max-h-72 overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-sm ring-1 ring-foreground/10"
        >
          {results.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {query.trim()
                ? `No staff match "${query.trim()}".`
                : "No staff available."}
            </p>
          ) : (
            results.map((member) => (
              <button
                key={member.userId}
                type="button"
                role="option"
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent",
                  selectedUserId === member.userId && "bg-accent/60",
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(member)}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{member.name}</p>
                  <p className="truncate text-muted-foreground">{member.email}</p>
                </div>
                {member.hasOrder && member.orderStatus ? (
                  <Badge variant="secondary" className="shrink-0">
                    {orderStatusLabel(member.orderStatus)}
                  </Badge>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
