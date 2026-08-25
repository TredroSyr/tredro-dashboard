"use client";

import { PhoneInput } from "@/components/tredro/phone-input";
import { Badge } from "@/components/ui/badge";
import { columns } from "@/module/users/_components/columns";
import { DataTable } from "@/module/users/_components/data-table";
import { DataTableRowActions } from "@/module/users/_components/data-table-row-actions";
import { useSubUsersQuery } from "@/module/users/hooks";
import { useState, useMemo } from "react";
import { PermissionGate } from "@/components/tredro/PermissionGate";

const PAGE_SIZE = 8;

function SubUsersPageContent() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: subUsersResponse, isLoading } = useSubUsersQuery();

  const subUsers = subUsersResponse?.data.subusers ?? [];

  const filteredSubUsers = useMemo(() => {
    if (!search.trim()) return subUsers;
    const q = search.toLowerCase();
    return subUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q),
    );
  }, [subUsers, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubUsers.length / PAGE_SIZE),
  );

  const paginatedSubUsers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSubUsers.slice(start, start + PAGE_SIZE);
  }, [filteredSubUsers, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <DataTable
      data={paginatedSubUsers}
      columns={columns}
      total={filteredSubUsers.length}
      search={search}
      onSearchChange={handleSearchChange}
      isLoading={isLoading}
      pagination={{ page, totalPages }}
      onPageChange={setPage}
      renderCard={(user) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-foreground">{user.name}</span>
            <Badge variant={user.is_active ? "default" : "destructive"}>
              {user.is_active ? "مفعّل" : "موقوف"}
            </Badge>
          </div>

          <PhoneInput value={user.phone} readOnly />
          <span className="text-sm text-muted-foreground">
            {user.email ?? "-"}
          </span>
          <div className="flex justify-end pt-2 border-t border-border">
            <DataTableRowActions row={{ original: user }} />
          </div>
        </div>
      )}
    />
  );
}

export default function SubUsersPage() {
  return (
    <PermissionGate ownerOnly>
      <SubUsersPageContent />
    </PermissionGate>
  );
}
