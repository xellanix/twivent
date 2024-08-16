import "./InputField.css";

import { memo } from "react";

const InputField = memo(function InputField({
    label,
    name,
    value,
    onChange,
    ...fieldProps
}: {
    label: string;
    name: string;
    value?: string;
    onChange?: (e: any) => void;
    [key: string]: any;
}) {
    return (
        <div className="vertical-layout xellanix-input-field">
            <label htmlFor={name}>{label}</label>
            <input
                name={name}
                id={name}
                value={value ?? ""}
                {...(onChange && { onChange })}
                {...fieldProps}
            />
        </div>
    );
});

export const LongTextField = memo(function LongTextField({
    label,
    name,
    value,
    onChange,
    ...fieldProps
}: {
    label: string;
    name: string;
    value?: string;
    onChange?: (e: any) => void;
    [key: string]: any;
}) {
    return (
        <div className="vertical-layout xellanix-input-field">
            <label htmlFor={name}>{label}</label>
            <textarea
                name={name}
                id={name}
                value={value ?? ""}
                {...(onChange && { onChange })}
                {...fieldProps}
            />
        </div>
    );
});

export default InputField;
