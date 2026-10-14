import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// NOTE: no <StrictMode>. The Call screen opens a live WebRTC connection in a
// mount effect; StrictMode's intentional double-mount (dev only) would open two
// connections and double the transcript. Omitting it keeps one call per mount.
createRoot(document.getElementById("root")!).render(<App />);
