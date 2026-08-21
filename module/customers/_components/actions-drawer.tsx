"use client";
import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";

import { Customer } from "../types";
import {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useCustomerQuery,
} from "../hooks";
import { useRepsQuery } from "@/module/reps/hooks";
import { PhoneInput } from "@/components/tredro/phone-input";
import { SearchableSelect } from "@/components/tredro/searchable-select";

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

const schema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  phone: z.string().min(1, "رقم الهاتف مطلوب"),
  email: z
    .string()
    .email("بريد إلكتروني غير صالح")
    .optional()
    .or(z.literal("")),
  category: z.string().optional(),
  assigned_reps: z.array(z.string()),
  is_active: z.boolean(),
});

type CustomerFormValues = z.infer<typeof schema>;

interface CustomerFormDrawerProps {
  mode: "create" | "edit";
  customerId?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerFormDrawer({
  mode,
  customerId,
  open,
  onOpenChange,
}: CustomerFormDrawerProps) {
  const isMobile = useIsMobile();

  const { data: customerRes, isLoading: isLoadingCustomer } = useCustomerQuery(
    customerId,
    {
      enabled: mode === "edit" && open && Boolean(customerId),
    },
  );
  const customer = customerRes?.data.customer as Customer | undefined;

  const { data: repsRes, isLoading: isLoadingReps } = useRepsQuery();
  const repOptions = React.useMemo(
    () =>
      (repsRes?.data?.reps ?? []).map((r) => ({
        value: String(r.id),
        label: r.name,
      })),
    [repsRes],
  );

  const { mutate: createCustomer, isPending: isCreating } =
    useCreateCustomerMutation();
  const { mutate: updateCustomer, isPending: isUpdating } =
    useUpdateCustomerMutation();

  const isSaving = isCreating || isUpdating;

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      category: "",
      assigned_reps: [],
      is_active: true,
    },
  });

  const [phoneReady, setPhoneReady] = React.useState(mode === "create");
  const [repPicker, setRepPicker] = React.useState("");

  React.useEffect(() => {
    if (!open) return;

    if (mode === "create") {
      form.reset({
        name: "",
        phone: "",
        email: "",
        category: "",
        assigned_reps: [],
        is_active: true,
      });
      setPhoneReady(true);
      setRepPicker("");
      return;
    }

    setPhoneReady(false);
    if (customer) {
      form.reset({
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? "",
        category: customer.category ?? "",
        assigned_reps: (customer.assigned_reps_details ?? []).map((r) =>
          String(r.id),
        ),
        is_active: customer.is_active,
      });
      setPhoneReady(true);
      setRepPicker("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, mode, customer]);

  const isFieldsLoading = mode === "edit" && (isLoadingCustomer || !phoneReady);

  const onSubmit = (values: CustomerFormValues) => {
    const trimmedName = values.name.trim();
    const trimmedPhone = values.phone.trim();
    const trimmedEmail = values.email?.trim();
    const trimmedCategory = values.category?.trim();
    const repIds = values.assigned_reps.map((v) => Number(v));

    if (mode === "create") {
      createCustomer(
        {
          name: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail || undefined,
          category: trimmedCategory || undefined,
          assigned_reps: repIds.length ? repIds : undefined,
          is_active: values.is_active,
        },
        { onSuccess: () => onOpenChange(false) },
      );
      return;
    }

    updateCustomer(
      {
        id: customerId as number,
        name: trimmedName,
        phone: trimmedPhone,
        email: trimmedEmail || undefined,
        category: trimmedCategory || undefined,
        assigned_reps: repIds,
        is_active: values.is_active,
      },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  const phoneInputKey =
    mode === "edit"
      ? `edit-${customerId}-${phoneReady ? "ready" : "loading"}`
      : "create";

  return (
    <Drawer
      swipeDirection={isMobile ? "down" : "left"}
      open={open}
      onOpenChange={onOpenChange}
    >
      <DrawerContent
        className="
          flex flex-col
          w-full h-[92dvh] max-h-[92dvh] rounded-t-2xl
          sm:h-full sm:max-h-screen sm:w-full sm:max-w-lg sm:rounded-none
          md:max-w-xl
          lg:max-w-3xl
        "
      >
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col flex-1 min-h-0"
          >
            <DrawerHeader
              className="
                flex-row items-center justify-between gap-3
                px-4 pt-6 pb-3
                sm:px-6 sm:pt-4
                sticky top-0 z-10 bg-background border-b border-border
              "
            >
              <DrawerTitle className="text-right text-base sm:text-lg">
                {mode === "create" ? "إضافة عميل جديد" : "تعديل العميل"}
              </DrawerTitle>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="submit"
                  disabled={isSaving || isFieldsLoading}
                  size="sm"
                >
                  {isSaving ? "جارٍ الحفظ..." : "حفظ"}
                </Button>
                <DrawerClose>
                  <Button variant="outline" type="button" size="sm">
                    إلغاء
                  </Button>
                </DrawerClose>
              </div>
            </DrawerHeader>

            <div
              className="
                flex flex-col gap-4
                overflow-y-auto flex-1 min-h-0
                px-4 py-4 pb-8
                sm:px-6 sm:pb-6
              "
            >
              {mode === "create" && (
                <p className="text-xs text-muted-foreground bg-muted/30 border border-border rounded-md p-3 text-right">
                  سيتم إنشاء العميل بدون كلمة مرور. يقوم العميل بتعيين كلمة
                  المرور بنفسه عند التسجيل عبر التطبيق باستخدام رقم هاتفه.
                </p>
              )}

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right block">الاسم</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        isLoading={isFieldsLoading}
                        placeholder="أدخل اسم العميل"
                        className="text-right h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right block">
                      رقم الهاتف
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        key={phoneInputKey}
                        id="phone"
                        value={field.value}
                        onChange={field.onChange}
                        isLoading={isFieldsLoading}
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right block">
                      البريد الإلكتروني (اختياري)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        isLoading={isFieldsLoading}
                        placeholder="example@email.com"
                        dir="ltr"
                        className="h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-right block">
                      التصنيف (اختياري)
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        isLoading={isFieldsLoading}
                        placeholder="مثال: تاجر جملة"
                        className="text-right h-12"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="assigned_reps"
                render={({ field }) => {
                  const selectedReps = field.value
                    .map((id) => repOptions.find((o) => o.value === id))
                    .filter(Boolean) as { value: string; label: string }[];

                  const availableOptions = repOptions.filter(
                    (o) => !field.value.includes(o.value),
                  );

                  return (
                    <FormItem>
                      <FormLabel className="text-right block">
                        المندوبون المسؤولون
                      </FormLabel>
                      <FormControl>
                        <SearchableSelect
                          options={availableOptions}
                          value={repPicker}
                          onChange={(v) => {
                            field.onChange([...field.value, v]);
                            setRepPicker("");
                          }}
                          loading={isLoadingReps || isFieldsLoading}
                          placeholder="اختر مندوباً لإضافته"
                          searchPlaceholder="ابحث عن مندوب..."
                          emptyText={
                            availableOptions.length
                              ? "لا توجد نتائج"
                              : "تمت إضافة جميع المندوبين"
                          }
                        />
                      </FormControl>

                      {selectedReps.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {selectedReps.map((rep) => (
                            <Badge
                              key={rep.value}
                              variant="secondary"
                              className="gap-1 pr-1"
                            >
                              {rep.label}
                              <button
                                type="button"
                                onClick={() =>
                                  field.onChange(
                                    field.value.filter((v) => v !== rep.value),
                                  )
                                }
                                className="rounded-full hover:bg-muted-foreground/20"
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}

                      <FormDescription className="text-right">
                        يمكن ربط العميل بأكثر من مندوب، حتى من شركات مختلفة.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              {mode === "edit" && customer?.referral_code_used && (
                <FormItem>
                  <FormLabel className="text-right block">
                    كود الإحالة المستخدم
                  </FormLabel>
                  <div className="h-12 flex items-center px-3 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                    {customer.referral_code_used}
                  </div>
                  <FormDescription className="text-right">
                    الكود الذي سجّل به العميل عند الانضمام، وهو ثابت لا يتغير
                    حتى لو تم تعديل المندوبين المسؤولين لاحقاً.
                  </FormDescription>
                </FormItem>
              )}

              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                    <FormLabel>الحساب مفعّل</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        isLoading={isFieldsLoading}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}
