// IMPORT SECTION
// node_modules
import { memo, useRef, useEffect, useCallback } from "react";
// local components
import { Position } from "./SharedTypes.tsx";
import {
    getCenterPos,
    twibbon,
} from "./SharedFunc.tsx";
// assets
// local assets
// styles

type Image = {
    src: string | File;
    pos: Position;
    w: number;
    h: number;
};

type ImageData = {
    src: string | File | null;
    pos: Position;
    w: number;
    h: number;
    cover: boolean;
};

type ImageCanvas = {
    img: HTMLImageElement;
    pos: Position;
    w: number;
    h: number;
    cover: boolean;
};

const getImageData = async (file: File) => {
    return new Promise((resolve: (value: string | ArrayBuffer | null) => void, reject) => {
        const reader = new FileReader();
        reader.onload = function (event) {
            resolve(event.target?.result ?? null); // Extract base64 data
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
};

const makeImageCanvas = async (data: ImageData, signal: AbortSignal) => {
    const { src, pos, w, h, cover } = data;

    const source = typeof src === "string" ? src : ((await getImageData(src!)) as string);
    return new Promise((resolve: (value: ImageCanvas) => void, reject) => {
        const img = new Image();
        img.src = source;
        img.crossOrigin = "anonymous";

        img.onload = () => {
            if (signal.aborted) {
                reject("aborted");
            } else {
                resolve({ img, pos, w, h, cover });
            }
        };
        img.onerror = () => reject(`Error loading image`);

        signal.addEventListener("abort", () => {
            img.onerror = () => {};
            reject("aborted");
        });
    });
};

const PreviewSection = memo(function PreviewSection({
    image,
    width,
    height,
    scale,
}: {
    image: Image | null;
    width: number;
    height: number;
    scale: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const backCanvasRef = useRef<HTMLCanvasElement>(null);

    let images: ImageData[] = [];
    let hasUserPictureLayer = false;

    for (let i = 0; i < twibbon.totalLayer; i++) {
        const layer = twibbon.sources.get(`layer${i + 1}`);
        if (layer) {
            images.push({
                src: layer!,
                pos: { x: 0, y: 0 },
                w: twibbon.width,
                h: twibbon.height,
                cover: false,
            });
        }
        else {
            if (image) {
                images.push({...image, cover: true});
                hasUserPictureLayer = true;
            }
        }
    }

    if (!hasUserPictureLayer && image)
        images.push({...image, cover: true});

    useEffect(() => {
        const controller = new AbortController();
        const signal = controller.signal;

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");

        const backCanvas = backCanvasRef.current;
        const backCtx = backCanvas?.getContext("2d");

        const loadImages = async () => {
            try {
                const loaded = await Promise.all(
                    images.map((data: ImageData) => makeImageCanvas(data, signal))
                );

                // Clear the back buffer canvas
                backCtx?.clearRect(0, 0, backCanvas?.width!, backCanvas?.height!);

                loaded.reverse().forEach(({ img, pos, w, h, cover }) => {
                    if (cover) {
                        const { imagePosition, imageSize } = getCenterPos(
                            scale,
                            false,
                            backCanvas?.width!,
                            backCanvas?.height!,
                            img.width,
                            img.height
                        );

                        backCtx?.drawImage(
                            img,
                            imagePosition.x + pos.x,
                            imagePosition.y + pos.y,
                            imageSize.w!,
                            imageSize.h!
                        );
                    }

                    backCtx?.drawImage(img, pos.x, pos.y, w, h);
                });

                ctx?.clearRect(0, 0, canvas?.width!, canvas?.height!);
                ctx?.drawImage(backCanvas!, 0, 0);
            } catch (e: any | string) {
                if (e !== "aborted") {
                    console.log(e);
                }
            }
        };

        loadImages();

        return () => {
            controller.abort();
        };
    }, [image, width, height, scale]);

    const downloadImage = useCallback(() => {
        const canvas = canvasRef.current;
        const dataURL = canvas?.toDataURL("image/png");
        if (dataURL) {
            const a = document.createElement("a");
            a.href = dataURL;
            a.download = "twivent.png";
            a.click();
        }
    }, []);

    return (
        <div
            id="preview-section"
            className="vertical-layout flex-align-center"
            style={{
                minWidth: "250px",
                maxWidth: "350px",
                padding: "max(calc(var(--section-gap-vertical) * 7 / 4), 24px)",
                background: "var(--secondary-background-color)",
                borderRadius: "16px",
                boxShadow: "0 8px 40px 0 hsla(0, 0%, 0%, .2)",
                boxSizing: "border-box",
                flex: "35 1 0",
            }}>
            <canvas ref={canvasRef} width={width} height={height} style={{ width: "100%" }} />
            <canvas ref={backCanvasRef} width={width} height={height} style={{ display: "none" }} />
            <div className="wrapper-only">
                <button type="button" className="button accent" onClick={downloadImage}>
                    Download
                </button>
            </div>
        </div>
    );
});

export default PreviewSection;