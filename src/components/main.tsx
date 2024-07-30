// IMPORT SECTION
// node_modules
import React from "react";
import ReactDOM from "react-dom/client";
import { PopupProvider } from "xellanix-react";
// local components
import App from "./App.tsx";
// assets
// local assets
// styles
import "xellanix-react/style.css";
import "../styles/styles.css";
import "../styles/media-styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <PopupProvider iconSrc={`${import.meta.env.VITE_BASE_URL}icon.svg`} iconText="Twivent">
            <App />
        </PopupProvider>
    </React.StrictMode>
);
