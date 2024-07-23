// IMPORT SECTION
// node_modules
import { useEffect, useState, memo, useCallback } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
// local components
import ThemeSelector from "./ThemeSelector.tsx";
import ControlSection, { InputFileZone, ProcessFileZone } from "./ControlSection.tsx";
import PreviewSection from "./PreviewSection.tsx";
import { Position } from "./SharedTypes.tsx";
import { delay, getAllLatestTwibbonLayers, getAllLayersWithRaw, pageUrl, twibbon } from "./SharedFunc.tsx";
import ProgressBar from "./ProgressBar.tsx";
import AnalizeImage from "./AnalizeImage.tsx";
// assets
// local assets
// styles

const FixedLayer = memo(function FixedLayer() {
    return (
        <div
            className="horizontal-layout flex-align-right"
            id="fixed-container"
            style={{
                zIndex: "999",
                position: "fixed",
                height: "100%",
                width: "var(--content-max-width)",
                top: "32px",
                pointerEvents: "none",
            }}>
            <ThemeSelector />
        </div>
    );
});

function App() {
    const [file, setFile] = useState<File | null>(null);
    const [imageScale, setImageScale] = useState(100);
    const [imagePos, setImagePos] = useState<Position>({ x: 0, y: 0 });

    const [step, setStep] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [title, setTitle] = useState<string | null>("Title");
    const [subtitle, setSubtitle] = useState<string | null>(null);

    const [loadProgress, setLoadProgress] = useState(0);
    const [loadMax, setLoadMax] = useState(0);
    const [loadMessage, setLoadMessage] = useState("Loading...");

    // Get the URL parameters from the current window location
    let folder = new URLSearchParams(window.location.search).get("twiproj");

    const processFiles = useCallback(
        ({ title, subtitle }: { title: string; subtitle: string }) => {
            setTitle(title);
            setSubtitle(subtitle);
        },
        [setTitle, setSubtitle, setLoaded]
    );

    useEffect(() => {
        const getLayers = folder
            ? getAllLayersWithRaw(folder, setLoadProgress, setLoadMax, setLoadMessage)
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
                    style={{ rowGap: "calc(var(--section-gap-horizontal) * 1.5)" }}>
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
                            <AnalizeImage file={file!} setImageScale={setImageScale} setStep={setStep} />
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
                    {folder && (
                        <ProgressBar value={loadProgress} max={loadMax} message={loadMessage} />
                    )}
                </div>
            )}

            <FixedLayer />
        </>
    );
}

export default App;
