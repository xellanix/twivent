// IMPORT SECTION
// node_modules
import React, { memo, useCallback, useEffect, useState, useRef } from "react";
import { IconX, IconReload, IconArrowsMove, IconUpload, IconPhoto } from "@tabler/icons-react";
import { AspectRatio } from "react-aspect-ratio";
import { InfoBox, InfoStatus, Slider, SliderInput } from "xellanix-react";
// local components
import { Position } from "./SharedTypes.tsx";
import {
    makePreview,
    getCenterPos,
    delay,
    controllerData,
    getCenterPosFromAnchor,
    isSamePosition,
} from "./SharedFunc.tsx";
// assets
// local assets
// styles
import "react-aspect-ratio/aspect-ratio.css";

let box = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    scale: -1,
};

const setControllerSizePos = (canvas: HTMLImageElement, scale: number) => {
    return new Promise<void>((resolve) => {
        // create a temp image to get the size
        const temp = new Image();
        temp.src = canvas.src;
        temp.onload = () => {
            const { imagePosition, imageSize } = getCenterPos(
                scale,
                true,
                controllerData.width,
                controllerData.height,
                temp.width,
                temp.height
            );

            if (imageSize.width) canvas.style.width = `${imageSize.width!}%`;
            if (imageSize.height) canvas.style.height = `${imageSize.height!}%`;

            controllerData.centerPoint = imagePosition;

            resolve();
        };
    });
};

const setElementPos = (el: HTMLElement, pos: Position) => {
    el.style.top = `${pos.y}px`;
    el.style.left = `${pos.x}px`;
};

// bound a number in the min and max range
const boundNumber = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max);

const dragElement = (
    el: HTMLElement,
    setPosition: React.Dispatch<React.SetStateAction<Position>>
) => {
    let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0,
        lastTop = 0,
        lastLeft = 0;

    el.onmousedown = dragMouseDown;
    el.ontouchstart = dragMouseDown;

    function dragMouseDown(e: MouseEvent | TouchEvent) {
        e.preventDefault();

        const isMouse = e instanceof MouseEvent;

        const centerPos = controllerData.centerPoint;

        lastTop = el.offsetTop;
        lastLeft = el.offsetLeft;

        // get the mouse cursor position at startup:
        pos3 = (isMouse ? e.clientX : e.touches[0].clientX) - centerPos.x;
        pos4 = (isMouse ? e.clientY : e.touches[0].clientY) - centerPos.y;

        el.classList.add("on-drag");

        document.onmouseup = closeDragElement;
        document.ontouchend = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
        document.ontouchmove = elementDrag;
    }

    function elementDrag(e: MouseEvent | TouchEvent) {
        e.preventDefault();

        const isMouse = e instanceof MouseEvent;

        const centerPos = controllerData.centerPoint;

        const clientX = (isMouse ? e.clientX : e.touches[0].clientX) - centerPos.x;
        const clientY = (isMouse ? e.clientY : e.touches[0].clientY) - centerPos.y;

        // calculate the new cursor position:
        pos1 = pos3 - clientX;
        pos2 = pos4 - clientY;
        pos3 = clientX;
        pos4 = clientY;
        // set the element's new position:
        const top = el.offsetTop - pos2;
        const left = el.offsetLeft - pos1;

        el.style.top = `${top}px`;
        el.style.left = `${left}px`;
    }

    function closeDragElement() {
        // stop moving when mouse button is released:

        let finalx = boundNumber(el.offsetLeft, controllerData.width - el.offsetWidth, 0);
        let finaly = boundNumber(el.offsetTop, controllerData.height - el.offsetHeight, 0);

        el.style.top = `${finaly}px`;
        el.style.left = `${finalx}px`;

        setPosition((prev) => {
            const current = { x: finalx, y: finaly };

            if (lastTop === finaly && lastLeft === finalx) return prev;
            else return current;
        });

        el.classList.remove("on-drag");

        document.onmouseup = null;
        document.ontouchend = null;
        document.onmousemove = null;
        document.ontouchmove = null;
    }
};

const resetValue = <S,>(setter: React.Dispatch<React.SetStateAction<S>>, defaultValue: S) => {
    setter(defaultValue);
};

type ErrorMessage = {
    error: string;
};

const getAllowedFile = (files: FileList) => {
    if (files.length === 0) {
        return { error: "No file is dropped" } as ErrorMessage;
    }
    let droppedFiles = Array.from(files).filter((file) => {
        const fn = file.name;
        return fn.endsWith(".png") || fn.endsWith(".jpg") || fn.endsWith(".jpeg");
    });

    if (droppedFiles.length === 0) {
        return { error: "File is not supported" } as ErrorMessage;
    }

    droppedFiles = droppedFiles.filter((file) => file.size <= 1024 * 1024 * 10);

    if (droppedFiles.length === 0) {
        return { error: "File size is too large" } as ErrorMessage;
    }

    return droppedFiles[0];
};

export const InputFileZone = memo(function InputFileZone({
    setFile: setFile,
}: {
    setFile: React.Dispatch<React.SetStateAction<File | null>>;
}) {
    const [infoType, setInfoType] = useState<InfoStatus>(InfoStatus.Error);
    const [infoMessage, setInfoMessage] = useState<string | null>(null);

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
            console.error(error);
        }
    }, [setFile]);

    const handleDrop = useCallback(
        (ev: React.DragEvent) => {
            ev.preventDefault();
            const file = getAllowedFile(ev.dataTransfer.files);

            if (file instanceof File) {
                setInfoType(InfoStatus.Success);
                setInfoMessage("The file is ready to be processed");

                delay(1000).then(() => setFile(file as File));
            } else {
                setInfoType(InfoStatus.Error);
                setInfoMessage((file as ErrorMessage).error);
            }
        },
        [setFile]
    );

    return (
        <>
            {infoMessage && <InfoBox status={infoType}>{infoMessage}</InfoBox>}
            <div
                id="drag-drop-zone"
                className="vertical-layout flex-align-center flex-align-middle dash-border"
                onDrop={handleDrop}
                onDragOver={(ev) => ev.preventDefault()}
                onDragEnter={(ev) => {
                    ev.preventDefault();
                    ev.currentTarget.classList.add("dragover");
                }}
                onDragLeave={(ev) => {
                    ev.preventDefault();
                    ev.currentTarget.classList.remove("dragover");
                }}>
                <div
                    style={{
                        width: "3em",
                        height: "3em",
                        marginBottom: "var(--section-gap-vertical) !important",
                    }}>
                    <IconUpload color="var(--text-color)" size="100%" />
                </div>
                <h4 className="text-align-center">Drag and Drop File Here</h4>
                <div className="text-separator">or</div>
                <div className="wrapper-only">
                    <button type="button" className="button accent" onClick={browseFileClicked}>
                        Browse File
                    </button>
                </div>
                <br />
                <div
                    className="horizontal-layout vertical-gap2x flex-align-center"
                    style={{ flexWrap: "wrap" }}>
                    <div className="text-align-center">
                        Supported formats:
                        <br />
                        .png, .jpg, .jpeg
                    </div>
                    <div className="text-align-center">
                        Max file size:
                        <br />
                        10MB
                    </div>
                </div>
            </div>
        </>
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
    const controllerRef = useRef<HTMLImageElement>(null);
    const scaleSliderInputRef = useRef<HTMLInputElement>(null);

    const [draggedPos, setDraggedPos] = useState<Position>({ x: 0, y: 0 });

    const resetImage = useCallback(() => {
        setFile(null);
        box.scale = -1;
    }, [setFile]);

    useEffect(() => {
        if (file) {
            makePreview(file, controllerData.width * 3).then((src) => {
                if (controllerRef.current) {
                    const elem = controllerRef.current!;
                    elem.src = src;

                    setControllerSizePos(elem, imageScale).then(() => {
                        dragElement(elem, setDraggedPos);

                        if (box.scale < 0) {
                            box = {
                                ...controllerData.centerPoint,
                                width: elem.width,
                                height: elem.height,
                                scale: imageScale,
                            };
                        }

                        setImagePos({ ...imagePos });
                    });
                }
            });
        }
    }, [file]);

    useEffect(() => {
        if (controllerRef.current) {
            const elem = controllerRef.current!;

            setControllerSizePos(elem, imageScale).then(() => {
                const recalc = getCenterPosFromAnchor(
                    imageScale / box.scale,
                    true,
                    controllerData.width,
                    controllerData.height,
                    box.width,
                    box.height,
                    imagePos.y / controllerData.scale + box.y,
                    imagePos.x / controllerData.scale + box.x
                );

                setElementPos(elem, recalc.imagePosition);

                controllerData.centerPoint = {
                    x: -imagePos.x / controllerData.scale + recalc.imagePosition.x,
                    y: -imagePos.y / controllerData.scale + recalc.imagePosition.y,
                };
            });
        }
    }, [imageScale]);

    useEffect(() => {
        if (!controllerRef.current) return;

        const recalc = getCenterPosFromAnchor(
            imageScale / box.scale,
            true,
            controllerData.width,
            controllerData.height,
            box.width,
            box.height,
            imagePos.y / controllerData.scale + box.y,
            imagePos.x / controllerData.scale + box.x
        );

        setElementPos(controllerRef.current!, recalc.imagePosition);
    }, [imagePos]);

    useEffect(() => {
        const scale = imageScale / box.scale;
        const imageLeft = (2 * draggedPos.x + controllerData.width * (scale - 1)) / (2 * scale);
        const imageTop = (2 * draggedPos.y + controllerData.height * (scale - 1)) / (2 * scale);

        const posx = Math.round(-controllerData.scale * (box.x - imageLeft));
        const posy = Math.round(-controllerData.scale * (box.y - imageTop));

        setImagePos((prev) => {
            const current = { x: posx, y: posy };

            return isSamePosition(prev, current) ? prev : current;
        });
    }, [draggedPos]);

    return (
        <div className="vertical-layout vertical-gap2x">
            <div
                className="horizontal-layout small-gap flex-align-middle dash-border"
                style={{
                    padding: "var(--section-gap-vertical)",
                    borderRadius: "16px",
                }}>
                <div style={{ width: "min(max(10%, 36px), 48px)" }}>
                    <AspectRatio ratio={1 / 1}>
                        <IconPhoto color="var(--text-color)" size="100%" stroke={1.75} />
                    </AspectRatio>
                </div>

                <h6
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
                </h6>
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
                        width: `${controllerData.width}px`,
                        height: `${controllerData.height}px`,
                        position: "relative",
                        overflow: "hidden",
                        borderRadius: "16px",
                        pointerEvents: "none",
                        margin: "0 auto",
                    }}>
                    <img
                        ref={controllerRef}
                        style={{
                            position: "absolute",
                            objectFit: "cover",
                            objectPosition: "0 0",
                            cursor: "move",
                            pointerEvents: "initial",
                            transition:
                                "top 200ms ease-out, left 200ms ease-out, width 200ms ease-out, height 200ms ease-out",
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
                            delay(133).then(() => {
                                el.style.display = "none";
                            });
                        }}>
                        <div style={{ width: "3em", height: "3em" }}>
                            <IconArrowsMove color="var(--text-color)" size="100%" />
                        </div>
                        <h5 style={{ color: "var(--text-color)", fontWeight: "600" }}>
                            Drag to Move
                        </h5>
                    </div>
                </div>
                <div className="vertical-layout vertical-gap2x flex-fill">
                    <div className="vertical-layout">
                        <div className="horizontal-layout small-gap flex-align-middle">
                            <label htmlFor="image-scale" className="flex-fill">
                                Scale
                            </label>
                            <SliderInput
                                sliderInputRef={scaleSliderInputRef}
                                id="image-scale-text"
                                style={{ width: "64px" }}
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
                        <Slider
                            sliderInputRef={scaleSliderInputRef}
                            id="image-scale"
                            className="flex-fill"
                            min={100}
                            max={500}
                            defaultValue={imageScale}
                            step={1}
                            onDeferredChange={setImageScale}
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
