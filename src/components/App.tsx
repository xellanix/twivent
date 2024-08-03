// IMPORT SECTION
// node_modules
import { useEffect, useState, useCallback } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
// local components
import ThemeSelector from "./ThemeSelector.tsx";
import ControlSection, { InputFileZone, ProcessFileZone } from "./ControlSection.tsx";
import PreviewSection from "./PreviewSection.tsx";
import { Position } from "./SharedTypes.tsx";
import {
    delay,
    getAllLatestTwibbonLayers,
    getAllLayersWithRaw,
    pageUrl,
    twibbon,
} from "./SharedFunc.tsx";
import ProgressBar, { Progress } from "./ProgressBar.tsx";
import AnalizeImage from "./AnalizeImage.tsx";
// assets
// local assets
// styles

function App() {
    const [folder, setFolder] = useState<string | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [imageScale, setImageScale] = useState(100);
    const [imagePos, setImagePos] = useState<Position>({ x: 0, y: 0 });
    const [title, setTitle] = useState<string | null>("Title");
    const [subtitle, setSubtitle] = useState<string | null>(null);

    const [step, setStep] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [loadProgress, setLoadProgress] = useState<Progress>({ current: 0, max: 0 });
    const [loadMessage, setLoadMessage] = useState("Loading...");

    const processFiles = useCallback(
        ({ title, subtitle }: { title: string; subtitle: string }) => {
            setTitle(title);
            setSubtitle(subtitle);
        },
        [setTitle, setSubtitle]
    );

    const updateProgress = useCallback(
        (current?: number, max?: number) => {
            setLoadProgress((prev: Progress) => ({
                current: prev.current + (current ?? 0),
                max: prev.max + (max ?? 0),
            }));
        },
        [setLoadProgress]
    );

    useEffect(() => {
        // Get the URL parameters from the current window location
        let _folder = new URLSearchParams(window.location.search).get("twiproj");
        setFolder(_folder);

        const getLayers = _folder
            ? getAllLayersWithRaw(_folder, updateProgress, setLoadMessage)
            : getAllLatestTwibbonLayers();

        getLayers
            .then(processFiles)
            .then(() => delay(1000))
            .then(() => setLoaded(true));
    }, []);

    useEffect(() => {
        if (file) {
            setStep(1);
        } else {
            setStep(0);
            setImageScale(100);
            setImagePos({ x: 0, y: 0 });
        }
    }, [file]);

    return (
        <>
            {loaded ? (
                <div
                    className="vertical-layout flex-fill"
                    style={{ rowGap: "calc(var(--section-gap-horizontal) * 1.5)", padding: "48px 0" }}>
                    <div
                        className="vertical-layout flex-align-center flex-align-bottom flex-fill"
                        style={{ gap: "calc(var(--section-gap-vertical) * .5)" }}>
                        {title && <h2 className="text-align-center">{title}</h2>}
                        {subtitle && (
                            <h4
                                className="text-align-center"
                                style={{ color: "var(--accent-color)" }}>
                                {subtitle}
                            </h4>
                        )}
                    </div>
                    <main
                        className="horizontal-container-layout flex-align-top"
                        style={{ margin: "auto 0" }}>
                        {step === 2 && (
                            <PreviewSection
                                image={file ? { src: file!, pos: imagePos, w: 0, h: 0 } : null}
                                width={twibbon.width}
                                height={twibbon.height}
                                scale={imageScale}
                            />
                        )}
                        <ControlSection step={step}>
                            <InputFileZone setFile={setFile} />
                            <AnalizeImage
                                file={file!}
                                setImageScale={setImageScale}
                                setImagePos={setImagePos}
                                setStep={setStep}
                            />
                            <ProcessFileZone
                                file={file}
                                setFile={setFile}
                                imageScale={imageScale}
                                setImageScale={setImageScale}
                                imagePos={imagePos}
                                setImagePos={setImagePos}
                            />
                        </ControlSection>
                    </main>
                    <div className="vertical-layout flex-align-center flex-align-top flex-fill">
                        <span className="text-align-center">
                            Twivent (v{import.meta.env.VITE_APP_VER}
                            {folder && "f"}), made with love by DA02-XSTIA23
                        </span>
                        <ThemeSelector />
                    </div>
                </div>
            ) : (
                <div className="vertical-layout flex-align-center">
                    <DotLottieReact
                        src={`${pageUrl()}airplane.lottie`}
                        autoplay
                        loop
                        style={{ width: "var(--airplane-max-width)" }}
                    />
                    {loadProgress.max > 0 && (
                        <ProgressBar progress={loadProgress} message={loadMessage} />
                    )}
                </div>
            )}
        </>
    );
}

export default App;
