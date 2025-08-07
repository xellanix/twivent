// IMPORT SECTION
// node_modules
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
// local components
import { pageUrl, controllerData, getCenterPos, getContainDimensions } from "./SharedFunc";
import { detect } from "../workers/workerService"; // Import from the new service

import { Position, Size } from "./SharedTypes";
// assets
// local assets
// styles

type FaceData = {
    x: number;
    y: number;
    width: number;
    height: number;
};

/**
 * Calculates the maximum padding factor that can be applied to a rectangle
 * without it overflowing a given maximum area.
 *
 * @param face The initial rectangle.
 * @param max The bounding area that the padded rectangle cannot exceed.
 * @returns The maximum padding factor that can be safely applied.
 */
const estimateMaxPadding = (face: FaceData, max: Size): number => {
    // Calculate how much space is available for expansion on each side.
    const spaceLeft = face.x;
    const spaceRight = max.width - (face.x + face.width);
    const spaceTop = face.y;
    const spaceBottom = max.height - (face.y + face.height);

    // Determine the maximum allowed padding for the horizontal axis.
    // The expansion is centered, so it's limited by the smaller of the two sides.
    let maxHorizontalPadding = Infinity;
    if (face.width > 0) {
        // The total horizontal expansion is (newWidth - oldWidth), or (padding - 1) * width.
        // Half of this expansion goes to each side.
        // Formula derived from: (padding - 1) * width / 2 <= min(spaceLeft, spaceRight)
        const maxExpansion = Math.min(spaceLeft, spaceRight);
        maxHorizontalPadding = 1 + (2 * maxExpansion) / face.width;
    }

    // Determine the maximum allowed padding for the vertical axis.
    let maxVerticalPadding = Infinity;
    if (face.height > 0) {
        const maxExpansion = Math.min(spaceTop, spaceBottom);
        maxVerticalPadding = 1 + (2 * maxExpansion) / face.height;
    }

    // The overall maximum padding is the most restrictive (smallest) of the two axes.
    return Math.min(maxHorizontalPadding, maxVerticalPadding);
};

/**
 * Creates a new, larger rectangle by applying a padding factor, ensuring it
 * does not overflow a maximum area.
 *
 * If the requested padding would cause an overflow, the padding is reduced
 * to the maximum size that fits within the bounds.
 *
 * @param face The initial rectangle to pad.
 * @param padding The desired padding factor (e.g., 1.5 for 50% larger).
 * @param max The bounding area that the padded rectangle cannot exceed.
 * @returns A new, padded rectangle.
 */
const addPaddingToFace = (face: FaceData, padding: number, max: Size): FaceData => {
    // Estimate the maximum padding that will fit within the `max` area.
    const maxAllowedPadding = estimateMaxPadding(face, max);

    // Determine the effective padding to use. It's the smaller of the desired
    // padding and the maximum allowed. Clamp at 0 to prevent negative dimensions.
    const effectivePadding = Math.max(0, Math.min(padding, maxAllowedPadding));

    // Calculate the new rectangle dimensions and position with the safe padding factor.
    const nextWidth = face.width * effectivePadding;
    const nextHeight = face.height * effectivePadding;

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
    let downscaleFactor: number =
        imageWidth < imageHeight
            ? imageWidth / controllerData.width
            : imageHeight / controllerData.height;

    const imageToFace = downscaleFactor / face.height;
    let faceFactor = controllerData.height * imageToFace;

    // Check if the final size is bigger than the canvas
    if (face.width > imageWidth || face.height > imageHeight) {
        faceFactor = 1;
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

    // Literally I don't know why it fits if the number is 3.5
    // So, I called it magic number
    const magicNumber = faceFactor * 2;
    // Calculate the start point of the face on the canvas
    // The start point is the top left corner of the face
    // To achieve this, we need to get the most top left point of the image first
    // e.g. (-controllerData.scale * imagePosition.x) and (-controllerData.scale * imagePosition.y)
    // Then, we need to subtract it with the upscaled face point
    // e.g. (most left point - face.x * magicNumber) and (most top point - face.y * magicNumber)
    // The face point needs to be upscaled with the magic number, so it will fit the canvas
    const startPoint: [number, number] = [
        -controllerData.scale * imagePosition.x - face.x * magicNumber,
        -controllerData.scale * imagePosition.y - face.y * magicNumber,
    ];
    // Just upscale the face with the magic number, because the point is already upscaled
    const magicFaceSize: [number, number] = [face.width * magicNumber, face.height * magicNumber];
    // Upscale the controller size to contain the upscaled face
    const magicCoverSize = getContainDimensions(
        { width: magicFaceSize[0], height: magicFaceSize[1] },
        { width: controllerData.width, height: controllerData.height }
    );
    // Calculate the center point of the face on the canvas
    // Unlike the cartesian coordinate system, where the left area is negative and the right area is positive
    // In this canvas coordinate system, the left area is positive and the right area is negative
    // So we need to subtract the startPoint with the difference between the magicFaceSize and the magicCoverSize
    // If the difference is positive, the it will move the center point to the left
    // If the difference is negative, the it will move the center point to the right
    const centerPoint: [number, number] = [
        Math.round(startPoint[0] - (magicFaceSize[0] - magicCoverSize.width) / 2),
        Math.round(startPoint[1] - (magicFaceSize[1] - magicCoverSize.height) / 2),
    ];

    console.log("face: ", face);
    console.log("image: ", [imageWidth, imageHeight]);
    console.log("faceScale: ", faceFactor);
    console.log("magicNumber: ", magicNumber);
    console.log("topLeft: ", [
        -controllerData.scale * imagePosition.x,
        -controllerData.scale * imagePosition.y,
    ]);
    console.log("startPoint: ", startPoint);
    console.log("magicFaceSize: ", magicFaceSize);
    console.log("magicCoverSize: ", magicCoverSize);
    console.log("centerPoint: ", centerPoint);
    console.log("====================================================");

    return [faceScale, { x: centerPoint[0], y: centerPoint[1] }];
};

// Helper function to convert a File to ImageData
const fileToImageData = (file: File): Promise<ImageData> => {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const image = new Image();
        image.src = URL.createObjectURL(file);

        image.onload = () => {
            if (!ctx) {
                return reject(new Error("Failed to get canvas context"));
            }

            const MAX_DIMENSION = 600;
            if (image.width < image.height) {
                if (image.width >= MAX_DIMENSION) {
                    canvas.width = MAX_DIMENSION;
                    canvas.height = (MAX_DIMENSION * image.height) / image.width;
                } else {
                    canvas.width = image.width;
                    canvas.height = image.height;
                }
            } else {
                if (image.height >= MAX_DIMENSION) {
                    canvas.width = (MAX_DIMENSION * image.width) / image.height;
                    canvas.height = MAX_DIMENSION;
                } else {
                    canvas.width = image.width;
                    canvas.height = image.height;
                }
            }

            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(image.src); // Clean up memory
            resolve(imageData);
        };

        image.onerror = (err) => {
            URL.revokeObjectURL(image.src);
            reject(err);
        };
    });
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
    const [status, setStatus] = useState<string>("Analyzing...");

    useEffect(() => {
        const analyze = async () => {
            if (!file) return;

            try {
                // Convert the file to ImageData
                setStatus("Preparing image...");
                const imageData = await fileToImageData(file);

                // Send to worker for detection
                setStatus("Analyzing for faces...");
                const faces: FaceData[] = await detect(imageData);

                setStatus("Processing face area...");
                if (faces.length > 0) {
                    const face = addPaddingToFace(faces[0], 3.5, imageData);
                    const [faceScale, facePos] = analyzeScalePos(
                        imageData.width,
                        imageData.height,
                        face
                    );

                    if (faceScale <= 500) {
                        setImagePos(facePos);
                        setImageScale(faceScale);
                    }
                }

                setStep(2);
            } catch (error) {
                if (error instanceof Error) {
                    if (error.message === "Another detection is already in progress.") {
                        return;
                    }
                }
                console.error("An error occurred during analysis:", error);
                setStep(2);
            }
        };

        analyze();
    }, [file]);

    return (
        <div className="vertical-layout flex-align-center">
            <DotLottieReact
                src={`${pageUrl()}analize.lottie`}
                autoplay
                loop
                style={{ width: "var(--airplane-max-width)" }}
            />
            <label className="progress-label">{status}</label>
        </div>
    );
}
