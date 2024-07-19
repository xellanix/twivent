import { IconQuestionMark, IconExclamationMark, IconCheck, IconX } from "@tabler/icons-react";

export enum InfoStatus {
    Info = 0,
    Warning,
    Success,
    Error,
}

/**
 *
 * @param {string} status information, warning, success, error
 * @returns
 */
export default function InfoBox({
    status = InfoStatus.Info,
    children,
}: {
    status: InfoStatus;
    children: React.ReactNode;
}) {
    return (
        <div
            className={`info-box ${status}`}
            style={{
                backgroundColor:
                    status === InfoStatus.Warning
                        ? "var(--warning-background-color)"
                        : status === InfoStatus.Success
                        ? "var(--success-background-color)"
                        : status === InfoStatus.Error
                        ? "var(--error-background-color)"
                        : "var(--information-background-color)",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: "8px",
                borderRadius: "var(--button-border-radius)",
                padding: "16px",
                alignSelf: "stretch",
            }}>
            <div
                className="info-box-icon"
                style={{
                    backgroundColor:
                        status === InfoStatus.Warning
                            ? "var(--warning-color)"
                            : status === InfoStatus.Success
                            ? "var(--success-color)"
                            : status === InfoStatus.Error
                            ? "var(--error-color)"
                            : "var(--information-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--secondary-background-color)",
                    width: "24px",
                    height: "24px",
                    borderRadius: "32px",
                }}>
                {status === InfoStatus.Info && <IconQuestionMark size={14} stroke={2.5} />}
                {status === InfoStatus.Warning && <IconExclamationMark size={14} stroke={2.5} />}
                {status === InfoStatus.Success && <IconCheck size={14} stroke={2.5} />}
                {status === InfoStatus.Error && <IconX size={14} stroke={2.5} />}
            </div>
            <strong>{InfoStatus[status]}:</strong>
            {children}
        </div>
    );
}
