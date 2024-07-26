import React, { useState, useRef } from "react";

export default function InputField({
    refer,
    label,
    name,
    emptyError,
    patternError,
    onChange,
    ...fieldProps
}: {
    refer?: React.LegacyRef<HTMLInputElement>;
    label: string;
    name: string;
    emptyError?: string;
    patternError?: string;
    onChange?: (e: any) => void;
    [key: string]: any;
}) {
    const [error, setError] = useState<string | null>(null);

    const errorRef = useRef<HTMLSpanElement>(null);

    function checkValidity(e: any) {
        const target = e.target;
        const name = target.name;
        const value = target.value;

        // value not available
        if (!value) {
            setError(emptyError ?? null);
            console.error(`invalid ${name}: ${value} (${emptyError})`);
        } else setError(patternError ?? null);
    }

    return (
        <div className="vertical-layout" style={{ gap: "8px" }}>
            <label htmlFor={name}>{label}</label>
            <input
                ref={refer}
                name={name}
                id={name}
                {...fieldProps}
                onInvalid={checkValidity}
                onChange={(e) => {
                    onChange && onChange(e);

                    (emptyError || patternError) && checkValidity(e);
                }}
                style={{
                    padding: "16px",
                    border: "2px solid var(--separator-color2)",
                    borderRadius: "var(--button-border-radius)",
                }}
            />

            {error && (
                <span ref={errorRef} style={{ color: "var(--error-color)" }}>
                    {error}
                </span>
            )}
        </div>
    );
}
