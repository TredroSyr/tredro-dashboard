"use client";

import { PhoneInput } from "@/components/tredro/phone-input";
import { Badge } from "@/components/ui/badge";
import { columns } from "@/module/reps/_components/columns";
import { DataTable } from "@/module/reps/_components/data-table";
import { DataTableRowActions } from "@/module/reps/_components/data-table-row-actions";
import { useRepsQuery } from "@/module/reps/hooks";

import { useState, useMemo } from "react";

const PAGE_SIZE = 8;

export default function SubUsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data: reps, isLoading, isError, error, refetch } = useRepsQuery();

  const repsUser = reps?.data?.reps ?? [];

  const filteredSubUsers = useMemo(() => {
    if (!search.trim()) return repsUser;
    const q = search.toLowerCase();
    return repsUser.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        (u.referral_code ?? "").toLowerCase().includes(q),
    );
  }, [repsUser, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubUsers.length / PAGE_SIZE),
  );

  const paginatedReps = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredSubUsers.slice(start, start + PAGE_SIZE);
  }, [filteredSubUsers, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <DataTable
      data={paginatedReps}
      columns={columns}
      total={filteredSubUsers.length}
      search={search}
      onSearchChange={handleSearchChange}
      isLoading={isLoading}
      isError={isError}
      errorMessage={
        error instanceof Error ? error.message : "حدث خطأ أثناء تحميل البيانات"
      }
      onRetry={() => refetch()}
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
            {user.referral_code ?? "-"}
          </span>
          <div className="flex justify-end pt-2 border-t border-border">
            <DataTableRowActions row={{ original: user }} />
          </div>
        </div>
      )}
    />
  );
}
