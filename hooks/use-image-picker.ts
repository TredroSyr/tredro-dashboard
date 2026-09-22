"use client";

import { useCallback, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";
import { toast } from "@/components/ui/toast";

/** Requests camera/photos access and lets the user snap a photo or pick one from the gallery. */
async function pickImageNative(): Promise<File | null> {
  const permissions = await Camera.checkPermissions();
  const needsRequest =
    permissions.camera !== "granted" || permissions.photos !== "granted";

  if (needsRequest) {
    const requested = await Camera.requestPermissions({
      permissions: ["camera", "photos"],
    });
    if (requested.camera !== "granted" && requested.photos !== "granted") {
      toast.error(
        "يرجى السماح بالوصول إلى الكاميرا والصور من إعدادات الجهاز",
      );
      return null;
    }
  }

  const photo = await Camera.getPhoto({
    source: CameraSource.Prompt,
    resultType: CameraResultType.Uri,
    quality: 90,
    promptLabelHeader: "اختر صورة",
    promptLabelPhoto: "من المعرض",
    promptLabelPicture: "التقاط صورة",
  });
  if (!photo.webPath) return null;

  const blob = await (await fetch(photo.webPath)).blob();
  const ext = photo.format || "jpeg";
  return new File([blob], `image.${ext}`, { type: blob.type || `image/${ext}` });
}

/** Resolves with the file chosen in the native OS picker, or null if the user cancels. */
function pickImageWeb(input: HTMLInputElement): Promise<File | null> {
  return new Promise((resolve) => {
    const handleChange = () => {
      resolve(input.files?.[0] ?? null);
      input.value = "";
      input.removeEventListener("change", handleChange);
    };
    input.addEventListener("change", handleChange);
    input.click();
  });
}

/**
 * Cross-platform image picker: opens the native camera/gallery prompt (with permission
 * handling) inside a Capacitor app, or a plain <input type="file"> on the web.
 */
export function useImagePicker() {
  const inputRef = useRef<HTMLInputElement>(null);

  const pickImage = useCallback(async (): Promise<File | null> => {
    if (Capacitor.isNativePlatform()) {
      try {
        return await pickImageNative();
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        const userCancelled = /cancel/i.test(message);
        if (!userCancelled) toast.error("تعذر الوصول إلى الصور");
        return null;
      }
    }

    if (!inputRef.current) return null;
    return pickImageWeb(inputRef.current);
  }, []);

  return { inputRef, pickImage };
}
