// IMPORT SECTION
// node_modules
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
// local components
import { pageUrl, controllerData, getCenterPos } from "./SharedFunc";
import faceDetectionWorker from "../faceDetectionWorker?worker";
import { Position } from "./SharedTypes";
// assets
// local assets
// styles

type FaceData = {
    x: number;
    y: number;
    width: number;
    height: number;
};

const addPaddingToFace = (face: FaceData, padding: number): FaceData => {
    const nextWidth = face.width * padding;
    const nextHeight = face.height * padding;

    const nextX = face.x + (face.width - nextWidth) / 2;
    const nextY = face.y + (face.height - nextHeight) / 2;

    return {
        x: nextX,
        y: nextY,
        width: nextWidth,
        height: nextHeight,
    };
};

const analyzeScalePos = (
    imageWidth: number,
    imageHeight: number,
    face: FaceData
): [number, Position] => {
    let downscaleFactor: number = 0;
    let cappedWidth: number = 1;
    let cappedHeight: number = 1;

    if (imageWidth < imageHeight) {
        downscaleFactor = imageWidth / controllerData.width;
        // (cis * canvas.height) / canvas.width;
        cappedHeight = imageHeight / imageWidth;
    } else {
        downscaleFactor = imageHeight / controllerData.height;
        // (cis * canvas.width) / canvas.height
        cappedWidth = imageWidth / imageHeight;
    }

    const imageToFace = downscaleFactor / face.height;

    let faceFactor = controllerData.height * imageToFace;

    // cis = controllerData.width * faceFactor
    cappedWidth *= controllerData.width * faceFactor;
    cappedHeight *= controllerData.height * faceFactor;
    // cappedWidth / canvas.width
    const analyzeScale = cappedWidth / imageWidth;

    let finalLeft = face.x * analyzeScale;
    let finalTop = face.y * analyzeScale;

    // Check if the final size is bigger than the canvas
    if (face.width > imageWidth) {
        // Get the ratio and fit the final width to the canvas
        // ratio = (face.width * (cappedWidth / imageWidth)) / cappedWidth
        const ratio = face.width / imageWidth;

        faceFactor = 1;

        finalLeft = 0;
        finalTop /= ratio;
    } else if (face.height > imageHeight) {
        // Get the ratio and fit the final height to the canvas
        // ratio = (face.height * (cappedHeight / imageHeight)) / cappedHeight
        const ratio = face.height / imageHeight;

        faceFactor = 1;

        finalLeft /= ratio;
        finalTop = 0;
    }

    // Check the position is outside the canvas
    if (finalLeft < 0) {
        finalLeft = 0;
    } else if (finalTop < 0) {
        finalTop = 0;
    }

    const faceScale = Math.round(faceFactor * 100);
    const { imagePosition } = getCenterPos(
        faceScale,
        true,
        controllerData.width,
        controllerData.height,
        imageWidth / downscaleFactor,
        imageHeight / downscaleFactor
    );

    const posX = imagePosition.x + finalLeft;
    const posY = imagePosition.y + finalTop;

    return [faceScale, { x: posX, y: posY }];
};

export default function AnalizeImage({
    file,
    setImageScale,
    setImagePos,
    setStep,
}: {
    file: File;
    setImageScale: Dispatch<SetStateAction<number>>;
    setImagePos: Dispatch<SetStateAction<Position>>;
    setStep: Dispatch<SetStateAction<number>>;
}) {
    const [worker, setWorker] = useState<Worker | null>(null);

    useEffect(() => {
        const newWorker = new faceDetectionWorker();
        newWorker.onmessage = (event) => {
            const faces: FaceData[] = event.data.faces;
            const imageWidth = event.data.width;
            const imageHeight = event.data.height;

            if (faces.length > 0) {
                const face = addPaddingToFace(faces[0], 3.5);
                const [faceScale, facePos] = analyzeScalePos(imageWidth, imageHeight, face);

                if (faceScale <= 500) {
                    const posX = Math.round(-controllerData.scale * facePos.x);
                    const posY = Math.round(-controllerData.scale * facePos.y);

                    setImagePos({ x: posX, y: posY });
                    setImageScale(faceScale);
                }
            }

            setStep(2);
        };
        setWorker(newWorker);

        return () => {
            if (worker) {
                worker.terminate();
            }
        };
    }, []);

    useEffect(() => {
        const processBase64Image = (src: File) => {
            if (!worker || !src) return;

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const image = new Image();
            image.src = URL.createObjectURL(src);
            image.onload = () => {
                if (ctx) {
                    if (image.width < image.height) {
                        if (image.width >= 600) {
                            canvas.width = 600;
                            canvas.height = (600 * image.height) / image.width;
                        } else {
                            canvas.width = image.width;
                            canvas.height = image.height;
                        }
                    } else {
                        if (image.height >= 600) {
                            canvas.width = (600 * image.width) / image.height;
                            canvas.height = 600;
                        } else {
                            canvas.width = image.width;
                            canvas.height = image.height;
                        }
                    }

                    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    URL.revokeObjectURL(image.src);
                    worker.postMessage({ imageData });
                }
                URL.revokeObjectURL(image.src);
            };
        };

        processBase64Image(file);
    }, [worker]);

    return (
        <div className="vertical-layout flex-align-center">
            <DotLottieReact
                src={`${pageUrl()}analize.lottie`}
                autoplay
                loop
                style={{ width: "var(--airplane-max-width)" }}
            />
            <label className="progress-label">Analyzing...</label>
        </div>
    );
}
