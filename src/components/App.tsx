// IMPORT SECTION
// node_modules
import { useEffect, useState, memo } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
// local components
import ThemeSelector from "./ThemeSelector.tsx";
import ControlSection, { InputFileZone, ProcessFileZone } from "./ControlSection.tsx";
import PreviewSection from "./PreviewSection.tsx";
import { Position } from "./SharedTypes.tsx";
import { getAllLatestTwibbonLayers, twibbon } from "./SharedFunc.tsx";
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

    getAllLatestTwibbonLayers().then((_layers) => {
        if (_layers.has("metadata")) {
            fetch(_layers.get("metadata")!)
                .then((res) => res.json())
                .then((metadata) => {
                    _layers.delete("metadata");

                    setTitle(metadata.title);
                    setSubtitle(metadata.subtitle);

                    twibbon.width = metadata.width;
                    twibbon.height = metadata.height;
                });
        }
        twibbon.sources = _layers;
        setLoaded(true);
    });

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
                        {file && (
                            <PreviewSection
                                image={file ? { src: file, pos: imagePos, w: 0, h: 0 } : null}
                                width={twibbon.width}
                                height={twibbon.height}
                                scale={imageScale}
                            />
                        )}
                        <ControlSection step={step}>
                            <InputFileZone setFile={setFile} />
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
                            Twivent, made with love by DA02-XSTIA23
                        </span>
                    </div>
                </div>
            ) : (
                <DotLottieReact
                    src={`${import.meta.env.VITE_BASE_URL}airplane.lottie`}
                    autoplay
                    loop
                />
            )}

            <FixedLayer />
        </>
    );
}

export default App;
