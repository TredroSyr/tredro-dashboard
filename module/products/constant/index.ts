import { ProductFormValues } from "./../schema/index";
import { iconName } from "@/assets/icons/iconRenderer/types";

export const PRODUCT_TABS = [
  {
    value: "overview",
    label: "الاحصائيات",
    iconFilled: "dashbaord_filled" as iconName,
    iconOutlined: "dashbaord_outlined" as iconName,
    fields: [] as const,
  },
  {
    value: "basic",
    label: "معلومات أساسية",
    iconFilled: "overview_filled" as iconName,
    iconOutlined: "overview_outlined" as iconName,
    fields: [
      "name",
      "description",
      "sku",
      "barcode",
      "brand",
      "category",
      "unit",
      "is_active",
      "is_sellable",
      "is_purchasable",
    ] as const,
  },
  {
    value: "details",
    label: "تفاصيل",
    iconFilled: "overview_filled" as iconName,
    iconOutlined: "overview_outlined" as iconName,
    fields: [
      "weight",
      "weight_unit",
      "length",
      "width",
      "height",
      "dimension_unit",
      "reorder_point",
      "reorder_quantity",
      "is_taxable",
      "tax_rate",
      "external_reference",
      "notes",
    ] as const,
  },
  {
    value: "custom-fields",
    label: "حقول مخصصة",
    iconFilled: "overview_filled" as iconName,
    iconOutlined: "overview_outlined" as iconName,
    fields: ["custom_fields"] as const,
  },
  {
    value: "pricing",
    label: "التسعير",
    iconFilled: "payment_filled" as iconName,
    iconOutlined: "payment_outlined" as iconName,
    fields: ["prices"] as const,
  },
  {
    value: "images",
    label: "الصور",
    iconFilled: "cart_filled" as iconName,
    iconOutlined: "cart_outlined" as iconName,
    fields: ["images"] as const,
  },
  {
    value: "review",
    label: "المراجعة",
    iconFilled: "users_filled" as iconName,
    iconOutlined: "users_outlined" as iconName,
    fields: [] as const,
  },
] as const;

export type ProductTabValue = (typeof PRODUCT_TABS)[number]["value"];

export const getTabHasError = (
  tabValue: ProductTabValue,
  errors: Partial<Record<keyof ProductFormValues, unknown>>,
): boolean => {
  const tab = PRODUCT_TABS.find((t) => t.value === tabValue);
  if (!tab) return false;
  return tab.fields.some((field) =>
    Boolean(errors[field as keyof ProductFormValues]),
  );
};
