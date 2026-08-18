"use client";

import { columns } from "@/module/users/_components/columns";
import { DataTable } from "@/module/users/_components/data-table";
import { useSubUsersQuery } from "@/module/users/hooks";
import { useState, useMemo } from "react";

const PAGE_SIZE = 8;

export default function SubUsersPage() {
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
    />
  );
}
