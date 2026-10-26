export default function SectionRule({ label }: { label?: string }) {
  return <div className="section-rule" aria-hidden="true"><span />{label && <span className="section-rule__label">{label}</span>}<span /></div>;
}
