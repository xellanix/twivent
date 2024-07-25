import { useId } from "react";

export type Progress = {
    current: number;
    max: number;
}

export default function ProgressBar({
    progress,
    message,
}: {
    progress: Progress;
    message?: string;
}) {
    const id = useId();

    return (
        <div className="vertical-layout flex-align-center">
            <div
                id={`progress-bar-${id}`}
                style={{
                    position: "relative",
                    height: "8px",
                    display: "flex",
                    margin: "0 auto",
                    width: "40dvw",
                }}>
                <div
                    style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        backgroundColor: "var(--separator-color)",
                        borderRadius: "9999px",
                        opacity: 0.4,
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: `${(progress.current / progress.max) * 100}%`,
                        height: "100%",
                        backgroundColor: "var(--accent-color)",
                        borderRadius: "9999px",
                        transition: "width 200ms ease-out",
                    }}
                />
            </div>
            {typeof message !== "undefined" && (
                <label htmlFor={`progress-bar-${id}`} style={{ fontSize: "var(--h4-font-size)" }}>
                    {progress.current === progress.max && progress.max !== 0 ? "Done!" : message}
                </label>
            )}
        </div>
    );
}
