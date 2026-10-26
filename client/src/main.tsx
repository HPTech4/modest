import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

document.getElementById("seo-fallback")?.remove();
const mount = document.getElementById("root");
if (!mount) throw new Error("The application mount element is missing.");
createRoot(mount).render(<App />);
