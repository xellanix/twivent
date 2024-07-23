// IMPORT SECTION
// node_modules
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
// local components
import { controllerHeight, pageUrl } from "./SharedFunc";
// assets
// local assets
// styles

export default function AnalizeImage({
    file,
    setImageScale,
    setStep,
}: {
    file: File;
    setImageScale: Dispatch<SetStateAction<number>>;
    setStep: Dispatch<SetStateAction<number>>;
}) {
    const [worker, setWorker] = useState<Worker | null>(null);

    useEffect(() => {
        const newWorker = new Worker(new URL("../faceDetectionWorker.js", import.meta.url));
        newWorker.onmessage = (event) => {
            const faces = event.data.faces as { x: number; y: number; width: number; height: number }[];
            if (faces.length > 0) {
                const faceScale = ((controllerHeight() / faces[0].height) * 3) / 10;
                const percent = Math.round(100 * faceScale);
                console.log(percent);
                setImageScale(percent);
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
                        canvas.width = 250;
                        canvas.height = (250 * image.height) / image.width;
                    } else {
                        canvas.width = (250 * image.width) / image.height;
                        canvas.height = 250;
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
            <label style={{ fontSize: "var(--h4-font-size)" }}>Analyzing...</label>
        </div>
    );
}
