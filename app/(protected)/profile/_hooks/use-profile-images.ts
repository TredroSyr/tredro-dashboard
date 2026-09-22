"use client";

import { useCallback, useRef, useState } from "react";
import { useImagePicker } from "@/hooks/use-image-picker";

const MAX_LOGO_SIZE = 2 * 1024 * 1024;
const MAX_COVER_SIZE = 5 * 1024 * 1024;

const LOGO_ASPECT = 1;
const COVER_ASPECT = 3;

type ImageTarget = "logo" | "cover";

/**
 * Owns the logo/cover pick -> crop -> validate flow for the profile page: requests
 * camera/photos permission (native) or opens the file picker (web), then hands the
 * raw image to the crop dialog before accepting it as the final file.
 */
export function useProfileImages(initialLogo: string | null, initialCover: string | null) {
  const { inputRef: logoInputRef, pickImage: pickLogoImage } = useImagePicker();
  const { inputRef: coverInputRef, pickImage: pickCoverImage } = useImagePicker();

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialLogo);
  const [coverPreview, setCoverPreview] = useState<string | null>(initialCover);
  const [imagesError, setImagesError] = useState<string | null>(null);

  const [cropTarget, setCropTarget] = useState<ImageTarget | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const rawImageUrlRef = useRef<string | null>(null);

  const closeCropDialog = useCallback((open: boolean) => {
    if (open) return;
    if (rawImageUrlRef.current) {
      URL.revokeObjectURL(rawImageUrlRef.current);
      rawImageUrlRef.current = null;
    }
    setCropTarget(null);
    setCropImageSrc(null);
  }, []);

  const startCrop = useCallback((target: ImageTarget, file: File) => {
    const url = URL.createObjectURL(file);
    rawImageUrlRef.current = url;
    setCropTarget(target);
    setCropImageSrc(url);
  }, []);

  const pickLogo = useCallback(async () => {
    const file = await pickLogoImage();
    if (file) startCrop("logo", file);
  }, [pickLogoImage, startCrop]);

  const pickCover = useCallback(async () => {
    const file = await pickCoverImage();
    if (file) startCrop("cover", file);
  }, [pickCoverImage, startCrop]);

  const handleCropComplete = useCallback(
    (file: File) => {
      if (cropTarget === "logo") {
        if (file.size > MAX_LOGO_SIZE) {
          setImagesError("حجم الشعار يجب أن يكون أقل من 2 ميغابايت");
          return;
        }
        setLogoFile(file);
        setLogoPreview(URL.createObjectURL(file));
      } else if (cropTarget === "cover") {
        if (file.size > MAX_COVER_SIZE) {
          setImagesError("حجم الغلاف يجب أن يكون أقل من 5 ميغابايت");
          return;
        }
        setCoverFile(file);
        setCoverPreview(URL.createObjectURL(file));
      }
      setImagesError(null);
    },
    [cropTarget],
  );

  return {
    logoFile,
    coverFile,
    logoPreview,
    coverPreview,
    imagesError,
    logoInputRef,
    coverInputRef,
    pickLogo,
    pickCover,
    crop: {
      isOpen: cropTarget !== null,
      imageSrc: cropImageSrc,
      // Square for the logo (matches the rounded-2xl avatar), wide for the cover banner.
      aspect: cropTarget === "cover" ? COVER_ASPECT : LOGO_ASPECT,
      fileName: cropTarget === "cover" ? "cover.jpg" : "logo.jpg",
      onOpenChange: closeCropDialog,
      onCropComplete: handleCropComplete,
    },
  };
}
