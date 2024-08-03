// IMPORT SECTION
// node_modules
import { memo, useCallback, useEffect, useState } from "react";
// local components
// assets
import lightIcon from "../assets/sun-filled.svg";
import darkIcon from "../assets/moon-filled.svg";
// local assets
// styles
import "../styles/ThemeSelector.css";

const ThemeSelector = memo(function ThemeSelector() {
    const [useDarkMode, setUseDarkMode] = useState(false);

    useEffect(() => {
        setUseDarkMode(
            window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        );
    }, []);

    useEffect(() => {
        if (useDarkMode) {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
        }
    }, [useDarkMode]);

    const selectorChanged = useCallback(() => {
        setUseDarkMode(!document.body.classList.contains("dark-theme"));
    }, [setUseDarkMode]);

    return (
        <div className="wrapper-only">
            <button
                type="button"
                id="theme-button"
                className="button no-border"
                onClick={selectorChanged}>
                <img src={useDarkMode ? darkIcon : lightIcon} />
                <span>{useDarkMode ? "Dark" : "Light"}</span>
            </button>
        </div>
    );
});

export default ThemeSelector;
