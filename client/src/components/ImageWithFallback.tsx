import { useState } from "react";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackLabel?: string;
}

export default function ImageWithFallback({ src, alt, className = "", fallbackLabel = "Image unavailable", ...props }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div className={`image-fallback ${className}`} role="img" aria-label={alt || fallbackLabel}><span>{fallbackLabel}</span></div>;
  }
  return <img {...props} src={src} alt={alt ?? ""} className={className} loading={props.loading ?? "lazy"} onError={() => setFailed(true)} />;
}
