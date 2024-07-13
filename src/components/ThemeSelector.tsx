// IMPORT SECTION
// node_modules
import React, { memo, useCallback, useEffect, useState } from "react";
// local components
// assets
import lightIcon from "../assets/sun-filled.svg";
import darkIcon from "../assets/moon-filled.svg";
// local assets
// styles

const ThemeSelector = memo(function ThemeSelector() {
    const [useDarkMode, setUseDarkMode] = useState(false);

    useEffect(() => {
        setUseDarkMode(
            window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        );
    }, []);

    useEffect(() => {
        themeChanged();
    }, [useDarkMode]);

    const themeChanged = useCallback(() => {
        if (useDarkMode) {
            document.body.classList.remove("light-theme");
            document.body.classList.add("dark-theme");
        } else {
            document.body.classList.remove("dark-theme");
            document.body.classList.add("light-theme");
        }
    }, [useDarkMode]);

    const selectorChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setUseDarkMode(e.target.value === "darktheme");
    }, [setUseDarkMode]);

    return (
        <div id="theme-selector" onChange={selectorChanged}>
            <input
                type="radio"
                name="theme-selector"
                value="lighttheme"
                id="light-option"
                className="theme-option-radio"
                checked={!useDarkMode}
                tabIndex={-1}
            />
            <label htmlFor="light-option" className="theme-option">
                <img src={lightIcon} />
                <span>Light</span>
            </label>
            <input
                type="radio"
                name="theme-selector"
                value="darktheme"
                id="dark-option"
                className="theme-option-radio"
                checked={useDarkMode}
                tabIndex={-1}
            />
            <label htmlFor="dark-option" className="theme-option">
                <img src={darkIcon} />
                <span>Dark</span>
            </label>
        </div>
    );
})

export default ThemeSelector;
