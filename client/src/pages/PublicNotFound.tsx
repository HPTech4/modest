import { useEffect } from "react";
import Seo from "../components/Seo";
import SiteLayout from "../components/SiteLayout";
import { Link } from "wouter";

export default function PublicNotFound() {
  useEffect(() => {
    if (window.location.pathname !== "/404") window.location.replace("/404");
  }, []);
  return <SiteLayout><Seo title="Page not found | Modest fashion" description="The page you requested could not be found." noindex /><div className="page-container not-found"><p className="eyebrow">404 · Not found</p><h1>This page has wandered off.</h1><p>The link may have changed, or the page is no longer available.</p><Link className="button button--primary" href="/">Return to the home page</Link></div></SiteLayout>;
}
