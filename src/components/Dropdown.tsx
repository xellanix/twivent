import "./Dropdown.css";

import { memo, useCallback, useRef } from "react";

export const Dropdown = memo(function Dropdown({
    name = "",
    options,
    defaultValue = 0,
    placeholder = "",
    onChange,
}: {
    name?: string;
    options: string[];
    defaultValue?: number;
    placeholder?: string;
    onChange?: (e: { currentTarget: { value: string; valueAsNumber: number } }) => void;
}) {
    const optionMenuRef = useRef<HTMLDivElement>(null);

    const selectButtonClicked = useCallback(() => {
        if (optionMenuRef.current) {
            const curr = optionMenuRef.current;
            curr.classList.toggle("active");
            curr.children[1].scrollIntoView({
                behavior: "smooth",
            });
        }
    }, []);

    const optionsClicked = useCallback((ev: React.MouseEvent<HTMLUListElement>) => {
        const target = ev.target as HTMLElement;
        if (target.tagName === "LI") {
            const selectedOption = target.innerText;

            if (optionMenuRef.current) {
                const optionMenu = optionMenuRef.current;
                const btnText = optionMenu.children[0].children[0] as HTMLSpanElement;
                const before = btnText.innerText;

                optionMenu.classList.remove("active");

                if (before === selectedOption) return;
                btnText.innerText = selectedOption;
                onChange?.({
                    currentTarget: {
                        valueAsNumber: options.indexOf(selectedOption),
                        value: selectedOption,
                    },
                });
            }
        }
    }, []);

    return (
        <div ref={optionMenuRef} className="xellanix-dropdown" id={name}>
            <div className="dropdown-button" onClick={selectButtonClicked}>
                <span>{defaultValue === -1 ? placeholder : options[defaultValue]}</span>
                <div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--text-color)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round">
                        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                        <path d="M6 9l6 6l6 -6" />
                    </svg>
                </div>
            </div>
            <ul className="options" onClick={optionsClicked}>
                {options.map((option) => (
                    <li className="option" key={option}>
                        {option}
                    </li>
                ))}
            </ul>
        </div>
    );
});

export const DropdownField = memo(function DropdownField({
    name,
    label,
    options,
    defaultValue,
    placeholder,
    onChange,
}: {
    name: string;
    label: string;
    options: string[];
    defaultValue?: number;
    placeholder?: string;
    onChange?: (e: { currentTarget: { value: string; valueAsNumber: number } }) => void;
}) {
    return (
        <div key={name} className="vertical-layout" style={{ gap: "8px" }}>
            <label htmlFor={name}>{label}</label>
            <Dropdown
                name={name}
                options={options}
                defaultValue={defaultValue}
                placeholder={placeholder}
                onChange={onChange}
            />
        </div>
    );
});
