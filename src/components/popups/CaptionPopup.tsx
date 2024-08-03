// IMPORT SECTION
// node_modules
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
// local components
import InputField from "../InputField";
import { IconCheck, IconCopy, IconX } from "@tabler/icons-react";
import { delay, twibbon } from "../SharedFunc";
import { ReplacementParams } from "../SharedTypes";
// assets
// local assets
// styles

const replaceTemplate = (template: string, replacements: { [key: string]: string }): string => {
    return template.replace(/<<(\w+)>>/g, (_, key) => replacements[key] || `<<${key}>>`);
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
    const [formattedText, setFormattedText] = useState<string>("");

    useEffect(() => {
        const v3: { [key: string]: string } = Object.keys(replacements).reduce(
            (acc, key) => ({ ...acc, [key]: replacements[key].value || replacements[key].default }),
            {}
        );

        setFormattedText(replaceTemplate(template, v3));
    }, [template, replacements]);

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
            {formattedText}
        </pre>
    );
});

const CaptionPopup = memo(function CaptionPopup() {
    const [templateText, setTemplateText] = useState<string>("");
    const [params, setParams] = useState<ReplacementParams | null>(null);

    const [copyStatus, setCopyStatus] = useState<"accent" | "success" | "error">("accent");
    const preRef = useRef<HTMLPreElement>(null);

    useEffect(() => {
        const caption = twibbon.caption;
        if (!caption) return;

        setTemplateText(caption.template);
        setParams(caption.params);
    }, []);

    const paramChanged = useCallback(
        (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const elem = e.currentTarget;
            const val = elem.value || elem.placeholder || "";

            if (params) {
                setParams({
                    ...params,
                    [key]: {
                        ...params[key],
                        value: val,
                    },
                });
            }
        },
        [params, setParams]
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
                        className={`button ${copyStatus}`}
                        onClick={copyCaption}
                        style={{
                            height: "100%",
                            color: "var(--accent-button-text-color)",
                        }}>
                        {copyStatus === "accent" ? (
                            <>
                                <IconCopy color="var(--accent-button-text-color)" />
                                Copy
                            </>
                        ) : copyStatus === "success" ? (
                            <>
                                <IconCheck color="var(--accent-button-text-color)" />
                                Copied
                            </>
                        ) : (
                            <>
                                <IconX color="var(--accent-button-text-color)" />
                                Failed
                            </>
                        )}
                    </button>
                </div>
            </div>
            <div className="vertical-layout flex-fill" style={{ minWidth: "250px" }}>
                <h4 className="flex-self-center">Parameters</h4>
                <div className="vertical-layout">
                    {params &&
                        Object.keys(params).map((key) => (
                            <InputField
                                key={key}
                                name={key}
                                label={params[key].label}
                                placeholder={params[key].default}
                                value={params[key].value}
                                type="text"
                                onChange={paramChanged(key)}
                            />
                        ))}
                </div>
            </div>
        </div>
    );
});

export default CaptionPopup;
