import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import type { Product } from "../lib/types";
import { buildCustomOrderUrl, buildProductEnquiryUrl, buildUnavailableEnquiryUrl } from "../lib/whatsapp";
import { useStore } from "../contexts/StoreContext";

interface WhatsAppActionProps {
  label?: string;
  kind?: "custom" | "product" | "unavailable";
  product?: Product;
  options?: { size?: string; colour?: string; quantity?: number };
  details?: { style?: string; colour?: string; additional?: string };
  className?: string;
  variant?: "primary" | "secondary" | "text";
}

export default function WhatsAppAction({ label = "Order on WhatsApp", kind = "custom", product, options, details, className = "", variant = "primary" }: WhatsAppActionProps) {
  const { settings } = useStore();
  function handleClick() {
    let url: string | null = null;
    if (kind === "product" && product) {
      const productUrl = typeof window === "undefined" ? null : new URL(`/product/${encodeURIComponent(product.slug)}`, window.location.origin).toString();
      url = buildProductEnquiryUrl(settings.whatsapp_number, product, { businessName: settings.brand_name, productUrl, quantity: options?.quantity ?? 1, size: options?.size, colour: options?.colour });
    } else if (kind === "unavailable" && product) {
      const productUrl = typeof window === "undefined" ? null : new URL(`/product/${encodeURIComponent(product.slug)}`, window.location.origin).toString();
      url = buildUnavailableEnquiryUrl(settings.whatsapp_number, product, settings.brand_name, productUrl);
    } else {
      url = buildCustomOrderUrl(settings.whatsapp_number, details ?? {}, settings.brand_name);
    }
    if (!url) {
      toast.error(settings.whatsapp_number ? "This enquiry could not be prepared. Check the product options and try again." : "WhatsApp is not configured yet. Please contact the store owner for ordering information.");
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }
  return <button type="button" className={`button button--${variant} ${className}`} onClick={handleClick}><MessageCircle size={17} aria-hidden="true" />{label}</button>;
}
