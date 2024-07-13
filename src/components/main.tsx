// IMPORT SECTION
// node_modules
import React from "react";
import ReactDOM from "react-dom/client";
// local components
import App from "./App.tsx";
// assets
// local assets
// styles
import "../styles/main-frame.css";
import "../styles/header-section.css";
import "../styles/nav-styles.css";
import "../styles/flex-align.css";
import "../styles/text-align.css";
import "../styles/popup.css";
import "../styles/info-box.css";
import "../styles/button.css";
import "../styles/styles.css";
import "../styles/media-styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
