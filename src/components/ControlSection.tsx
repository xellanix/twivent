// IMPORT SECTION
// node_modules
import React, { memo, useCallback, useEffect, useState, useRef } from "react";
import { IconX, IconReload, IconArrowsMove, IconUpload } from "@tabler/icons-react";
import { AspectRatio } from "react-aspect-ratio";
// local components
import { Position } from "./SharedTypes.tsx";
import { getCenterPos, twibbonWidth, twibbonHeight, controllerWidth } from "./SharedFunc.tsx";
// assets
// local assets
// styles
import "react-aspect-ratio/aspect-ratio.css";

const controllerHeight = (controllerWidth * twibbonHeight) / twibbonWidth;
const controllerScale = twibbonWidth / controllerWidth;
let controllerCenterPos: Position = { x: 0, y: 0 };

const setControllerSizePos = (src: string, canvas: HTMLElement, scale: number) => {
    return new Promise<void>((resolve) => {
        // create a temp image to get the size
        const temp = new Image();
        temp.src = src;
        temp.onload = () => {
            const { imagePosition, imageSize } = getCenterPos(
                scale,
                true,
                controllerWidth,
                controllerHeight,
                temp.width,
                temp.height
            );

            if (imageSize.w) canvas.style.width = `${imageSize.w!}%`;
            if (imageSize.h) canvas.style.height = `${imageSize.h!}%`;

            controllerCenterPos = imagePosition;

            resolve();
        };
    });
};

function makePreview(src: File, min: number) {
    return new Promise<string>((resolve, reject) => {
        // create a temp image to get the size
        const temp = new Image();
        temp.src = URL.createObjectURL(src);
        temp.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (ctx) {
                if (temp.width < temp.height) {
                    canvas.width = min;
                    canvas.height = (min * temp.height) / temp.width;
                } else {
                    canvas.width = (min * temp.width) / temp.height;
                    canvas.height = min;
                }
                ctx.drawImage(temp, 0, 0, canvas.width, canvas.height);

                URL.revokeObjectURL(temp.src);
                resolve(canvas.toDataURL("image/png"));
            }

            URL.revokeObjectURL(temp.src);
            reject;
        };
    });
}

const dragElement = (
    el: HTMLElement,
    setPosition: React.Dispatch<React.SetStateAction<Position>>
) => {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;

    el.onmousedown = dragMouseDown;
    el.ontouchstart = dragMouseDown;

    function dragMouseDown(e: MouseEvent | TouchEvent) {
        e.preventDefault();

        const isMouse = e instanceof MouseEvent;

        // get the mouse cursor position at startup:
        pos3 = (isMouse ? e.clientX : e.touches[0].clientX) - controllerCenterPos.x;
        pos4 = (isMouse ? e.clientY : e.touches[0].clientY) - controllerCenterPos.y;

        document.onmouseup = closeDragElement;
        document.ontouchend = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e: MouseEvent | TouchEvent) {
        e.preventDefault();

        const isMouse = e instanceof MouseEvent;

        const clientX = (isMouse ? e.clientX : e.touches[0].clientX) - controllerCenterPos.x;
        const clientY = (isMouse ? e.clientY : e.touches[0].clientY) - controllerCenterPos.y;

        // calculate the new cursor position:
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        // set the element's new position:
        const top = el.offsetTop - controllerCenterPos.y - pos2;
        const left = el.offsetLeft - controllerCenterPos.x - pos1;

        setPosition({
            x: Math.round(left * controllerScale),
            y: Math.round(top * controllerScale),
        });
    }

    function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;
    }
};

const resetValue = <S,>(setter: React.Dispatch<React.SetStateAction<S>>, defaultValue: S) => {
    setter(defaultValue);
};

export const InputFileZone = memo(function InputFileZone({
    setFile: setFile,
}: {
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
    const selectFile = useCallback(async () => {
        return new Promise((resolve: (value: File | null) => void, reject) => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".png, .jpg, .jpeg";
            input.onchange = () => {
                const file = input.files?.item(0) ?? null;

                const filesize = file?.size ?? Infinity;
                if (filesize > 1024 * 1024 * 10) {
                    reject(`File too big: ${filesize}`);
                }

                resolve(file);
            };
            input.oncancel = () => {
                resolve(null);
            };

            input.click();
        });
    }, []);

    const browseFileClicked = useCallback(async () => {
        try {
            const file = await selectFile();

            setFile(file);
        } catch (error) {
            console.log(error);
        }
    }, [setFile]);

    const handleDrop = useCallback(
        (ev: React.DragEvent) => {
            ev.preventDefault();
            let droppedFiles = Array.from(ev.dataTransfer.files).filter(
                (file) =>
                    file.name.endsWith(".png") ||
                    file.name.endsWith(".jpg") ||
                    file.name.endsWith(".jpeg")
            );

            if (droppedFiles.length === 0) {
                console.log("File not supported");
                return;
            }

            droppedFiles = droppedFiles.filter((file) => file.size <= 1024 * 1024 * 10);

            if (droppedFiles.length === 0) {
                console.log("File too big");
                return;
            }

            setFile(droppedFiles[0] ?? null);
        },
        [setFile]
    );

    return (
        <div
            id="drag-drop-zone"
            className="vertical-layout flex-align-center flex-align-middle flex-self-center dash-border"
            onDrop={handleDrop}
            onDragOver={(ev) => ev.preventDefault()}>
            <IconUpload
                color="var(--text-color)"
                style={{
                    width: "calc(var(--button-font-size) * 3) !important",
                    height: "calc(var(--button-font-size) * 3) !important",
                    marginBottom: "var(--section-gap-vertical) !important",
                }}
            />
            <h4 className="text-align-center">Drag and Drop File Here</h4>
            <div className="text-separator">or</div>
            <div className="wrapper-only">
                <button type="button" className="button accent" onClick={browseFileClicked}>
                    Browse File
                </button>
            </div>
            <br />
            <div className="text-align-center">
                Supported formats:
                <br />
                .png, .jpg, .jpeg
            </div>
            <div className="text-align-center">Max file size: 10MB</div>
        </div>
    );
});

export const ProcessFileZone = memo(function ProcessFileZone({
    file,
    setFile,
    imageScale,
    setImageScale,
    imagePos,
    setImagePos,
}: {
    file: File | null;
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
    imageScale: number;
    setImageScale: React.Dispatch<React.SetStateAction<number>>;
    imagePos: Position;
    setImagePos: React.Dispatch<React.SetStateAction<Position>>;
}) {
    const imageRef = useRef<HTMLImageElement>(null);
    const canvasRef = useRef<HTMLImageElement>(null);

    const [anchorPoint, setAnchorPoint] = useState<Position>({ x: 0, y: 0 });

    const resetImage = useCallback(() => {
        setFile(null);
    }, [setFile]);

    useEffect(() => {
        if (file) {
            makePreview(file, 64).then((src) => {
                if (imageRef.current) {
                    imageRef.current.src = src;
                }
            });

            makePreview(file, 250).then((src) => {
                if (canvasRef.current) {
                    const canvas = canvasRef.current!;
                    canvas.src = src;

                    setControllerSizePos(src, canvas, 100).then(() => {
                        setAnchorPoint(controllerCenterPos);
                        dragElement(canvas, setImagePos);
                    });
                }
            });
        }
    }, [file]);

    useEffect(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current!;

            setControllerSizePos(canvas.src, canvas, imageScale).then(() => {
                setAnchorPoint(controllerCenterPos);
            });
        }
    }, [imageScale]);

    return (
        <div className="vertical-layout vertical-gap2x">
            <div
                className="horizontal-layout small-gap flex-align-middle dash-border"
                style={{
                    padding: "var(--section-gap-vertical)",
                    borderRadius: "16px",
                }}>
                <div style={{ width: "min(max(10%, 36px), 96px)" }}>
                    <AspectRatio ratio={1 / 1}>
                        <img
                            ref={imageRef}
                            width={16}
                            height={16}
                            alt=""
                            style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: "8px",
                            }}
                        />
                    </AspectRatio>
                </div>

                <h4
                    style={{
                        fontWeight: "600",
                        overflow: "hidden",
                        WebkitLineClamp: "2",
                        lineClamp: "2",
                        display: "-webkit-box",
                        WebkitBoxOrient: "vertical",
                        flex: "1 1 0",
                    }}>
                    {file?.name || "Unknown"}
                </h4>
                <div className="wrapper-only">
                    <button type="button" className="button icon no-border" onClick={resetImage}>
                        <IconX color="var(--text-color)" />
                    </button>
                </div>
            </div>

            <div
                className="horizontal-layout vertical-gap2x"
                style={{
                    borderRadius: "16px",
                }}>
                <div
                    id="image-controller"
                    style={{
                        width: `${controllerWidth}px`,
                        height: `${controllerHeight}px`,
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: "16px",
                        pointerEvents: "none",
                        margin: "0 auto",
                    }}>
                    <img
                        ref={canvasRef}
                        style={{
                            position: "absolute",
                            objectFit: "cover",
                            objectPosition: "0 0",
                            cursor: "move",
                            top: `${imagePos.y / controllerScale + anchorPoint.y}px`,
                            left: `${imagePos.x / controllerScale + anchorPoint.x}px`,
                            pointerEvents: "initial",
                        }}
                    />
                    <div
                        id="image-controller-helper"
                        className="vertical-layout flex-align-center flex-align-middle dark-theme"
                        style={{
                            position: "relative",
                            width: "100%",
                            height: "100%",
                            backgroundColor: "rgba(0, 0, 0, 0.6)",
                            opacity: 1,
                            pointerEvents: "auto",
                        }}
                        onClick={(ev) => {
                            const el = ev.currentTarget;
                            el.classList.add("hide");
                            setTimeout(() => {
                                el.style.display = "none";
                            }, 133);
                        }}>
                        <IconArrowsMove
                            color="var(--text-color)"
                            style={{
                                width: "calc(var(--button-font-size) * 3) !important",
                                height: "calc(var(--button-font-size) * 3) !important",
                            }}
                        />
                        <h4 style={{ color: "var(--text-color)", fontWeight: "600" }}>
                            Drag to Move
                        </h4>
                    </div>
                </div>
                <div className="vertical-layout vertical-gap2x flex-fill">
                    <div className="vertical-layout">
                        <div className="horizontal-layout small-gap flex-align-middle">
                            <label htmlFor="image-scale" className="flex-fill">
                                Scale
                            </label>
                            <input
                                type="number"
                                name="image-scale-text"
                                id="image-scale-text"
                                min={0}
                                max={500}
                                step={10}
                                value={imageScale}
                                style={{ width: "64px" }}
                                onChange={(ev) => setImageScale(Number(ev.currentTarget.value))}
                            />
                            <div className="wrapper-only">
                                <button
                                    type="button"
                                    className="button icon no-border"
                                    onClick={() => resetValue<number>(setImageScale, 100)}>
                                    <IconReload
                                        color="var(--text-color)"
                                        style={{ opacity: 0.75 }}
                                    />
                                </button>
                            </div>
                        </div>
                        <input
                            className="flex-fill"
                            type="range"
                            name="image-scale"
                            id="image-scale"
                            min={0}
                            max={500}
                            value={imageScale}
                            onChange={(ev) => setImageScale(Number(ev.currentTarget.value))}
                        />
                    </div>

                    <div className="horizontal-layout use-space-between small-gap">
                        <div
                            className="horizontal-layout small-gap flex-align-middle flex-fill"
                            style={{ flexWrap: "nowrap" }}>
                            <label htmlFor="image-pos-x" className="flex-fill">
                                X
                            </label>
                            <input
                                type="tel"
                                name="image-pos-x"
                                id="image-pos-x"
                                step={1}
                                value={Number.isNaN(imagePos.x) ? "-" : imagePos.x}
                                pattern="-?[0-9]+"
                                style={{ width: "96px" }}
                                onChange={(ev) =>
                                    setImagePos({
                                        x: Number(ev.currentTarget.value),
                                        y: imagePos.y,
                                    })
                                }
                            />
                            <div className="wrapper-only flex-hug">
                                <button
                                    type="button"
                                    className="button icon no-border"
                                    onClick={() =>
                                        resetValue<Position>(setImagePos, { x: 0, y: imagePos.y })
                                    }>
                                    <IconReload
                                        color="var(--text-color)"
                                        style={{ opacity: 0.75 }}
                                    />
                                </button>
                            </div>
                        </div>
                        <div
                            className="horizontal-layout small-gap flex-align-middle flex-fill"
                            style={{ flexWrap: "nowrap" }}>
                            <label htmlFor="image-pos-y" className="flex-fill">
                                Y
                            </label>
                            <input
                                type="tel"
                                name="image-pos-y"
                                id="image-pos-y"
                                step={1}
                                value={Number.isNaN(imagePos.y) ? "-" : imagePos.y}
                                pattern="-?[0-9]+"
                                style={{ width: "96px" }}
                                onChange={(ev) =>
                                    setImagePos({
                                        x: imagePos.x,
                                        y: Number(ev.currentTarget.value),
                                    })
                                }
                            />
                            <div className="wrapper-only flex-hug">
                                <button
                                    type="button"
                                    className="button icon no-border"
                                    onClick={() =>
                                        resetValue<Position>(setImagePos, { x: imagePos.x, y: 0 })
                                    }>
                                    <IconReload
                                        color="var(--text-color)"
                                        style={{ opacity: 0.75 }}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const ControlSection = memo(function ControlSection({
    step,
    children,
}: {
    step: number;
    children: React.ReactNode;
}) {
    // children to array
    const childrenArray = React.Children.toArray(children);

    return (
        <div
            className="vertical-layout"
            style={{
                minWidth: "50%",
                borderRadius: "16px",
                flex: "65 1 0",
            }}>
            {childrenArray[step]}
        </div>
    );
});

export default ControlSection;
