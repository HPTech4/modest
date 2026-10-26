import { useState } from "react";
import WhatsAppAction from "./WhatsAppAction";

export default function CustomOrderEnquiry({ compact = false }: { compact?: boolean }) {
  const [style, setStyle] = useState("");
  const [colour, setColour] = useState("");
  const [additional, setAdditional] = useState("");
  return <div className={`custom-enquiry ${compact ? "custom-enquiry--compact" : ""}`}>
    <div className="custom-enquiry__fields">
      <label>Preferred style <span className="field-optional">(optional)</span><input value={style} onChange={(event) => setStyle(event.target.value)} placeholder="A simple description" maxLength={120} /></label>
      <label>Preferred colour <span className="field-optional">(optional)</span><input value={colour} onChange={(event) => setColour(event.target.value)} placeholder="Your colour preference" maxLength={60} /></label>
      <label className="custom-enquiry__wide">Additional details <span className="field-optional">(optional)</span><textarea value={additional} onChange={(event) => setAdditional(event.target.value)} placeholder="Anything else you would like to ask" rows={compact ? 2 : 3} maxLength={500} /></label>
    </div>
    <WhatsAppAction label="Start a custom enquiry" details={{ style, colour, additional }} variant="primary" />
    <p className="form-note">You can begin without sharing measurements or personal details.</p>
  </div>;
}
