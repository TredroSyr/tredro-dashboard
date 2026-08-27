import Image from "next/image";

export function Loading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <Image
        src="/tredro/full_logo.svg"
        alt="Tredro Logo"
        width={160}
        height={80}
        className="animate-pulse"
      />
    </div>
  );
}
