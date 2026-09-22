"use client";

import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IconRenderer } from "@/assets/icons/iconRenderer";
import { getCroppedImageBlob } from "@/lib/image/get-cropped-image";

interface ImageCropDialogProps {
  open: boolean;
  imageSrc: string | null;
  /** Width / height ratio of the crop box, e.g. 1 for a square avatar or 16/9 for a cover. */
  aspect: number;
  cropShape?: "rect" | "round";
  /** Name given to the cropped output file. */
  fileName: string;
  onOpenChange: (open: boolean) => void;
  onCropComplete: (file: File) => void;
}

export function ImageCropDialog({
  open,
  imageSrc,
  aspect,
  cropShape = "rect",
  fileName,
  onOpenChange,
  onCropComplete,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetState = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) resetState();
      onOpenChange(next);
    },
    [onOpenChange, resetState],
  );

  const handleSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsSaving(true);
    try {
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels);
      onCropComplete(new File([blob], fileName, { type: blob.type }));
      resetState();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>قص وتعديل الصورة</DialogTitle>
        </DialogHeader>

        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-muted">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            />
          )}
        </div>

        <div className="flex items-center gap-3 px-1">
          <IconRenderer
            name="image_outlined"
            className="h-4 w-4 shrink-0 text-muted-foreground"
          />
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-primary"
            aria-label="تكبير الصورة"
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!croppedAreaPixels || isSaving}
          >
            {isSaving ? "جارِ الحفظ..." : "حفظ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
