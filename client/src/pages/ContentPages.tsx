import { Link } from "wouter";
import Seo from "../components/Seo";
import SiteLayout from "../components/SiteLayout";
import WhatsAppAction from "../components/WhatsAppAction";
import CustomOrderEnquiry from "../components/CustomOrderEnquiry";
import { PageHeading } from "../components/States";
import { useStore } from "../contexts/StoreContext";
import type { StoreSettings } from "../lib/types";
import { OFFICIAL_BRAND_NAME } from "../lib/types";
import { buildCustomOrderUrl } from "../lib/whatsapp";

function TextContent({ text }: { text: string }) {
  return <div className="prose-copy">{text.split(/\n{2,}/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>;
}

export function AboutPage() {
  const { settings } = useStore();
  return <SiteLayout><Seo title={`About ${OFFICIAL_BRAND_NAME}`} description={`Meet ${OFFICIAL_BRAND_NAME}, a Nigerian modest Islamic women's fashion brand for abayas, hijabs, khimars, jilbabs, gowns and custom-made outfits.`} /><div className="page-container content-page"><PageHeading eyebrow="Our point of view" title="Considered in every layer" description={`An introduction to ${OFFICIAL_BRAND_NAME}, shaped by the details the store chooses to share.`} /><div className="content-page__body">{settings.about_text?.trim() ? <TextContent text={settings.about_text} /> : <p className="lead-copy">A space for considered modest dressing — thoughtfully layered, easy to wear, and shaped around the details that matter to you. The owner will add the approved brand story here.</p>}<Link className="text-link" href="/shop">Explore the collection →</Link></div></div></SiteLayout>;
}

export function ContactPage() {
  const { settings } = useStore();
  const whatsappHref = settings.whatsapp_number ? buildCustomOrderUrl(settings.whatsapp_number, {}, settings.brand_name) : null;
  const contacts = [settings.contact_email && { label: "Email", value: settings.contact_email, href: `mailto:${settings.contact_email}` }, settings.contact_phone && { label: "Phone", value: settings.contact_phone, href: `tel:${settings.contact_phone}` }, settings.whatsapp_number && { label: "WhatsApp", value: settings.whatsapp_number, href: whatsappHref, external: true }, settings.location_text && { label: "Location", value: settings.location_text, href: undefined }].filter(Boolean) as { label: string; value: string; href?: string | null; external?: boolean }[];
  return <SiteLayout><Seo title={`Contact ${OFFICIAL_BRAND_NAME} | Nigeria`} description="Contact Mustaqeem Stitches and Collection about modest wear in Nigeria. Ask to confirm availability in Ibadan, Ayegun, Olomi or Olunde." /><div className="page-container content-page"><PageHeading eyebrow="Get in touch" title="Let's begin a conversation" description="For product questions or a custom idea, choose the way that feels easiest." /><p className="lead-copy">Looking for modest wear in Ibadan, Ayegun, Olomi or Olunde? Contact the store to confirm current availability and ordering details for your area.</p><div className="contact-layout"><section className="contact-card"><p className="eyebrow">Store contact</p>{contacts.length ? <dl className="contact-list">{contacts.map((item) => <div key={item.label}><dt>{item.label}</dt><dd>{item.href ? <a href={item.href} target={item.external ? "_blank" : undefined} rel={item.external ? "noreferrer" : undefined}>{item.value}</a> : item.value}</dd></div>)}</dl> : <p>Contact details will be added by the store owner.</p>}{settings.instagram_url && <p><a className="text-link" href={settings.instagram_url} target="_blank" rel="noreferrer">Instagram ↗</a></p>}<WhatsAppAction label="Message the store" variant="secondary" /></section><section><div id="custom-order"><p className="eyebrow">Custom-made</p><h2>Tell us what you have in mind.</h2><p>Share a style, colour or a few details to begin. Measurements are not required to start an enquiry.</p><CustomOrderEnquiry /></div></section></div></div></SiteLayout>;
}

export function FaqPage() {
  const { settings } = useStore();
  const faqText = settings.faq_information?.trim() ?? "";
  const questions = [
    { question: "How do I enquire about a piece?", answer: "Choose the options offered on a product page and use its WhatsApp enquiry action. The message is sent to the store for availability, final price and delivery confirmation; opening WhatsApp does not complete an order or payment." },
    { question: "What if a product has no listed price?", answer: "The listing will say to enquire for pricing. Please ask the store to confirm the current price before ordering." },
    { question: "Can I ask about a custom-made outfit?", answer: "Yes. A custom enquiry can begin with an optional style or colour preference. You do not need to provide measurements or personal details to start." },
  ];
  return <SiteLayout><Seo title={`Modest wear FAQs | Mustaqeem Stitches`} description="Answers about abayas, hijabs, khimars, jilbabs, prices and custom-made modest outfits from Mustaqeem Stitches and Collection." /><div className="page-container content-page"><PageHeading eyebrow="A little clarity" title="Frequently asked questions" description="Helpful information for exploring the modest-fashion collection in Nigeria." /><div className="faq-list">{faqText ? <TextContent text={faqText} /> : questions.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div></SiteLayout>;
}

const policyFields: Record<string, { title: string; description: string; key: keyof StoreSettings }> = {
  sizing: { title: "Sizing information", description: "Information about the sizing options available for the collection.", key: "sizing_information" },
  delivery: { title: "Delivery information", description: "Delivery details provided by the store owner.", key: "delivery_information" },
  exchanges: { title: "Exchange information", description: "The store's published exchange and return information.", key: "exchange_policy" },
  privacy: { title: "Privacy information", description: "Privacy information provided by the store owner.", key: "privacy_information" },
};

export function PolicyPage({ kind }: { kind: "sizing" | "delivery" | "exchanges" | "privacy" }) {
  const { settings } = useStore();
  const policy = policyFields[kind];
  const text = settings[policy.key];
  return <SiteLayout><Seo title={`${policy.title} | Mustaqeem Stitches`} description={`${policy.description} Published by Mustaqeem Stitches and Collection in Nigeria.`} /><div className="page-container content-page"><PageHeading eyebrow="Store information" title={policy.title} description={policy.description} /><div className="content-page__body">{typeof text === "string" && text.trim() ? <TextContent text={text} /> : <p className="lead-copy">This information has not been provided by the store owner yet. Please contact the store to confirm details before placing an order.</p>}</div></div></SiteLayout>;
}
