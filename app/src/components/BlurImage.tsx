import { useState } from "react";

export default function BlurImage({
  src,
  alt,
  className = "",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      onLoad={() => setLoaded(true)}
      className={`transition duration-500 ease-out ${loaded ? "blur-none scale-100" : "scale-105 blur-md"} ${className}`}
    />
  );
}
