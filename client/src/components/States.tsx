import { Link } from "wouter";
import { AlertCircle, LoaderCircle } from "lucide-react";

export function LoadingState({ label = "Loading" }: { label?: string }) {
  return <div className="state-card" role="status"><LoaderCircle className="spin" size={22} /><span>{label}…</span></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="state-card state-card--error" role="alert"><AlertCircle size={20} /><span>{message}</span>{onRetry && <button className="button button--secondary button--small" onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title, message, actionHref, actionLabel }: { title: string; message: string; actionHref?: string; actionLabel?: string }) {
  return <div className="empty-state"><span className="empty-state__rule" /><h3>{title}</h3><p>{message}</p>{actionHref && actionLabel && <Link className="text-link" href={actionHref}>{actionLabel} →</Link>}</div>;
}

export function PageHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return <div className="page-heading">{eyebrow && <p className="eyebrow">{eyebrow}</p>}<h1>{title}</h1>{description && <p className="page-heading__description">{description}</p>}</div>;
}
