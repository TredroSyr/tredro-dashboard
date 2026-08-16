import axios from "axios";
import { toast } from "sonner";

declare module "axios" {
  export interface InternalAxiosRequestConfig {
    retryCount?: number;
  }
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    if (config.retryCount === undefined) {
      config.retryCount = 0;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (error.code === "ECONNABORTED" || !error.response) {
      const maxRetries = 2;

      if (config && config.retryCount < maxRetries) {
        config.retryCount += 1;

        toast.loading(
          `إعادة المحاولة... (${config.retryCount}/${maxRetries})`,
          {
            id: "network-retry",
          },
        );

        await new Promise((resolve) => setTimeout(resolve, 1500));
        return api(config);
      }

      toast.dismiss("network-retry");
      toast.error("تعذر الاتصال بالسيرفر", {
        description: "تأكد من اتصالك بالإنترنت وحاول مجددًا",
      });

      return Promise.reject(error);
    }

    const status = error.response.status;

    switch (status) {
      case 400:
        toast.error("طلب غير صحيح", {
          description:
            error.response.data?.message || "تأكد من البيانات المدخلة",
        });
        break;

      case 401:
        toast.error("انتهت الجلسة", {
          description: "الرجاء تسجيل الدخول مجددًا",
        });
        break;

      case 403:
        toast.error("غير مصرح لك بهذا الإجراء");
        break;

      case 404:
        toast.error("العنصر غير موجود");
        break;

      case 429:
        toast.error("طلبات كثيرة جدًا", {
          description: "الرجاء الانتظار قليلاً والمحاولة مجددًا",
        });
        break;

      case 500:
      case 502:
      case 503:
        toast.error("خطأ في السيرفر", {
          description: "الرجاء المحاولة لاحقًا",
        });
        break;

      default:
        toast.error("حدث خطأ غير متوقع", {
          description: error.response.data?.message || "",
        });
    }

    return Promise.reject(error);
  },
);

export default api;
