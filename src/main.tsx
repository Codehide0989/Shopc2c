import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css"; // Assuming index.css is in the root, but vite might need it imported

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
