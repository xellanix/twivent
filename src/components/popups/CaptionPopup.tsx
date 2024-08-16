// IMPORT SECTION
// node_modules
import { memo, useCallback, useEffect, useRef, useState } from "react";
// local components
import InputField, { LongTextField } from "../InputField";
import { IconCheck, IconCopy, IconX } from "@tabler/icons-react";
import { delay, twibbon } from "../SharedFunc";
import { ReplacementParams } from "../SharedTypes";
import { DropdownField } from "../Dropdown";
// assets
// local assets
// styles

type ButtonStatus = "accent" | "success" | "error";

const transformToKeyValue = (replacements: ReplacementParams): { [key: string]: string } => {
    const result: { [key: string]: string } = {};

    for (const key in replacements) {
        if (replacements.hasOwnProperty(key)) {
            result[key] = replacements[key].value || replacements[key].default;
        }
    }

    return result;
};

const replaceTemplate = (template: string, raw: ReplacementParams): React.ReactNode[] => {
    const replacements = transformToKeyValue(raw);

    const regex = /<<(\w+)>>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(template)) !== null) {
        const [placeholder, key] = match;
        const startIndex = match.index;
        const endIndex = regex.lastIndex;

        // Add the text before the placeholder
        parts.push(template.slice(lastIndex, startIndex));

        // Add the replacement with a span element
        parts.push(
            <span key={key} className="template-replacement">
                {replacements[key] || placeholder}
            </span>
        );

        lastIndex = endIndex;
    }

    // Add the remaining text after the last placeholder
    parts.push(template.slice(lastIndex));

    return parts;
};

const renderBtnContent = (status: ButtonStatus) => {
    switch (status) {
        case "accent":
            return (
                <>
                    <IconCopy color="currentColor" />
                    Copy
                </>
            );
        case "success":
            return (
                <>
                    <IconCheck color="currentColor" />
                    Copied
                </>
            );
        case "error":
            return (
                <>
                    <IconX color="currentColor" />
                    Failed
                </>
            );
    }
};

const controlField = (
    key: string,
    param: ReplacementParams[keyof ReplacementParams],
    paramChanged: (key: string) => (e: any) => void
) => {
    switch (param.type) {
        case 1:
            return (
                <LongTextField
                    key={key}
                    name={key}
                    label={param.label}
                    placeholder={param.default}
                    value={param.value}
                    onChange={paramChanged(key)}
                />
            );
        case 2:
            return (
                <DropdownField
                    key={key}
                    name={key}
                    label={param.label}
                    options={param.options!}
                    placeholder={param.default}
                    defaultValue={-1}
                    onChange={paramChanged(key)}
                />
            );
        default:
            return (
                <InputField
                    key={key}
                    name={key}
                    label={param.label}
                    placeholder={param.default}
                    value={param.value}
                    type="text"
                    onChange={paramChanged(key)}
                />
            );
    }
};

const TemplateText = memo(function TemplateText({
    preRef,
    template,
    replacements,
}: {
    preRef: React.LegacyRef<HTMLPreElement>;
    template: string;
    replacements: ReplacementParams;
}) {
    const [result, setResult] = useState<React.ReactNode[]>([]);

    useEffect(() => setResult(replaceTemplate(template, replacements)), [template, replacements]);

    return (
        <pre
            ref={preRef}
            style={{
                background: "var(--ternary-background-color2)",
                minHeight: "100px",
                padding: "calc(var(--section-gap-vertical) * 1.5)",
                borderRadius: "16px",
                lineHeight: "1.5",
                textWrap: "wrap",
                margin: "0px",
                overflowY: "auto",
                width: "100%",
                boxSizing: "border-box",
            }}>
            {result}
        </pre>
    );
});

const CaptionPopup = memo(function CaptionPopup() {
    const [templateText, setTemplateText] = useState<string>("");
    const [params, setParams] = useState<ReplacementParams>({});

    const [copyStatus, setCopyStatus] = useState<ButtonStatus>("accent");
    const preRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        const caption = twibbon.caption;
        if (!caption) return;

        setTemplateText(caption.template);
        setParams(caption.params);
    }, []);

    const paramChanged = useCallback(
        (key: string) => (e: any) => {
            const elem = e.currentTarget;
            const val = elem.value;

            setParams((prev) => ({
                ...prev,
                [key]: {
                    ...prev[key],
                    value: val,
                },
            }));
        },
        []
    );

    const copyCaption = useCallback(async () => {
        if (preRef.current) {
            const caption = preRef.current.innerText;

            console.log(caption);

            navigator.clipboard.writeText(caption);

            setCopyStatus("success");
            await delay(2000);
            setCopyStatus("accent");

            return;
        }

        setCopyStatus("error");
    }, [preRef]);

    return (
        <div
            className="horizontal-container-layout flex-align-center"
            style={{ maxWidth: "80dvw" }}>
            <div
                className="vertical-layout flex-fill flex-align-center"
                style={{
                    minWidth: "40dvw",
                    maxHeight: "70dvh",
                    boxSizing: "border-box",
                }}>
                <h4>Preview</h4>
                <TemplateText preRef={preRef} template={templateText} replacements={params ?? {}} />
                <div className="wrapper-only" style={{ flexDirection: "row" }}>
                    <button
                        type="button"
                        className={`button template-copy-button ${copyStatus}`}
                        onClick={copyCaption}>
                        {renderBtnContent(copyStatus)}
                    </button>
                </div>
            </div>
            <div className="vertical-layout flex-fill" style={{ minWidth: "250px" }}>
                <h4 className="flex-self-center">Parameters</h4>
                <div className="vertical-layout">
                    {params &&
                        Object.keys(params).map((key) =>
                            controlField(key, params[key], paramChanged)
                        )}
                </div>
            </div>
        </div>
    );
});

export default CaptionPopup;
