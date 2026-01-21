"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FALLBACK_SRC = "/assets/images/no_image.png";

function AppImage({
  src,
  alt = "Image Name",
  className = "",
  sizes = "100vw",
  width,
  height,
  fill,
  priority = false,
  ...props
}) {
  const [currentSrc, setCurrentSrc] = useState(src || FALLBACK_SRC);

  useEffect(() => {
    setCurrentSrc(src || FALLBACK_SRC);
  }, [src]);

  const sharedProps = {
    className,
    onError: () => setCurrentSrc(FALLBACK_SRC),
    priority: priority || currentSrc === FALLBACK_SRC,
    ...props,
  };

  if (typeof width === "number" && typeof height === "number") {
    return (
      <Image
        {...sharedProps}
        alt={alt}
        src={currentSrc || FALLBACK_SRC}
        width={width}
        height={height}
      />
    );
  }

  return (
    <Image
      {...sharedProps}
      alt={alt}
      src={currentSrc || FALLBACK_SRC}
      sizes={sizes}
      fill={fill ?? true}
    />
  );
}

export default AppImage;
