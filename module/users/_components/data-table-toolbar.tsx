"use client";
import * as React from "react";
import { Plus, Search } from "lucide-react";
import { Table } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ModuleName, Permission } from "../types";
import { useCreateSubUserMutation, useModulesQuery } from "../hooks";

type PermissionLevel = "none" | "read" | "read_write";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
  total?: number;
  search: string;
  onSearchChange?: (value: string) => void;
}

export function DataTableToolbar<TData>({
  table,
  total,
  search,
  onSearchChange,
}: DataTableToolbarProps<TData>) {
  const [addDialogOpen, setAddDialogOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [levels, setLevels] = React.useState<Record<string, PermissionLevel>>(
    {},
  );

  const { data: modulesRes } = useModulesQuery();
  const modules = modulesRes?.data.modules ?? [];

  const { mutate: addSubUser, isPending: isAdding } =
    useCreateSubUserMutation();

  const resetForm = () => {
    setName("");
    setPhone("");
    setEmail("");
    setPassword("");
    setLevels({});
  };

  const permissions: Permission[] = Object.entries(levels)
    .filter(([, level]) => level !== "none")
    .map(([module, level]) => ({
      module: module as ModuleName,
      can_view: true,
      can_action: level === "read_write",
    }));

  const canSubmit =
    name.trim() &&
    phone.trim() &&
    password.length >= 6 &&
    permissions.length > 0;

  return (
    <>
      <div className="flex items-center justify-between border-b px-6 py-6 border-border">
        <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <span>المستخدمون الفرعيون</span>
          {total !== undefined && <Badge>{total} مستخدم</Badge>}
        </h1>
      </div>

      <div className="flex items-center justify-between py-4 px-6 gap-3 border-b border-border">
        <div className="relative w-[280px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            placeholder="ابحث عن مستخدم..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pr-9"
          />
        </div>
        <Button size="sm" onClick={() => setAddDialogOpen(true)}>
          <Plus className="size-4" />
          إضافة مستخدم فرعي
        </Button>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">
              إضافة مستخدم فرعي جديد
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-right">الاسم</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="أدخل اسم المستخدم"
                className="text-right"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-right">رقم الهاتف</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-right">البريد الإلكتروني (اختياري)</Label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
                dir="ltr"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-right">كلمة المرور</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6 أحرف على الأقل"
                dir="ltr"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-right">الصلاحيات</Label>
              <div className="flex flex-col gap-2 rounded-md border border-border p-3">
                {modules.map((m) => (
                  <div
                    key={m.value}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{m.label}</span>
                    <Select
                      value={levels[m.value] ?? "none"}
                      onValueChange={(v: PermissionLevel) =>
                        setLevels((prev) => ({ ...prev, [m.value]: v }))
                      }
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">بدون صلاحية</SelectItem>
                        <SelectItem value="read">قراءة فقط</SelectItem>
                        <SelectItem value="read_write">قراءة وكتابة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex-row-reverse gap-2">
            <Button
              disabled={isAdding || !canSubmit}
              onClick={() => {
                addSubUser(
                  {
                    name: name.trim(),
                    phone: phone.trim(),
                    email: email.trim() || undefined,
                    password,
                    permissions,
                  },
                  {
                    onSuccess: () => {
                      setAddDialogOpen(false);
                      resetForm();
                    },
                  },
                );
              }}
            >
              {isAdding ? "جارٍ الإضافة..." : "إضافة"}
            </Button>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
