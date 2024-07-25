// IMPORT SECTION
// node_modules
import {
    useState,
    useRef,
    useEffect,
    Dispatch,
    SetStateAction,
    ReactNode,
    createContext,
    useContext,
} from "react";
import { IconX, IconArrowLeft } from "@tabler/icons-react";
// local components
// assets
// local assets
// styles

type PopupItem = JSX.Element;

type Popup = {
    item: PopupItem | null;
    setItem: Dispatch<SetStateAction<PopupItem | null>>;
    isOpen: boolean;
    setIsOpen: Dispatch<SetStateAction<boolean>>;
};

type PopupProviderProps = {
    iconSrc: string;
    iconText: string;
    children: ReactNode;
};

const PopupContext = createContext<Popup | null>(null);

export default function PopupProvider({
    iconSrc,
    iconText,
    children,
}: PopupProviderProps) {
    const [item, setItem] = useState<PopupItem | null>(null);
    const [isOpen, setIsOpen] = useState<boolean>(false);

    return (
        <PopupContext.Provider value={{ item, setItem, isOpen, setIsOpen }}>
            {children}

            <PopupRoot isOpen={isOpen}>
                <PopupSection setIsOpen={setIsOpen} iconSrc={iconSrc} iconText={iconText}>
                    {item}
                </PopupSection>
            </PopupRoot>
        </PopupContext.Provider>
    );
}

export function usePopup() {
    const context = useContext(PopupContext);

    if (!context) {
        throw new Error("usePopup must be used within a PopupProvider");
    }

    return context;
}

function PopupSection({
    setIsOpen,
    iconSrc,
    iconText,
    canBack,
    backHandler,
    children,
}: {
    setIsOpen: Dispatch<SetStateAction<boolean>>;
    iconSrc: string;
    iconText: string;
    canBack?: boolean;
    backHandler?: () => void;
    children?: ReactNode;
}) {
    const [defaultHeight, setDefaultHeight] = useState<number | null>(null);
    const [totalHeight, setTotalHeight] = useState<number | null>(null);

    const observedDiv = useRef(null);

    useEffect(() => {
        if (!observedDiv.current) {
            return;
        }

        const resizeObserver = new ResizeObserver(([entry]) => {
            const ph = entry.target.parentElement?.parentElement?.offsetHeight ?? 0;
            const clippedHeight = entry.target.parentElement?.offsetHeight ?? 0;
            const contentHeight = entry.target.scrollHeight;

            const usedHeight = ph - clippedHeight;
            const current = (defaultHeight ?? usedHeight) + contentHeight;

            setTotalHeight(current);
            setDefaultHeight(usedHeight);
        });

        resizeObserver.observe(observedDiv.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, [observedDiv.current]);

    function closeAnyPopup() {
        document.querySelector("#popup")?.classList.add("out");

        setTimeout(() => {
            setIsOpen(false);
        }, 300);
    }

    return (
        <div
            id="popup"
            className="popup vertical-layout"
            style={{ height: totalHeight ?? "auto", minWidth: "100px" }}>
            <div className="horizontal-layout">
                {canBack && (
                    <div
                        className="default-back-button vertical-layout flex-align-middle flex-align-center"
                        onClick={backHandler}>
                        <IconArrowLeft stroke={2.5} />
                    </div>
                )}
                <div className="icon-landscape">
                    <img src={iconSrc} alt={`${iconText} Icon`} />
                    <div>{iconText}</div>
                </div>
                <div
                    className="default-close-button vertical-layout flex-align-middle flex-align-center"
                    onClick={closeAnyPopup}>
                    <IconX stroke={2.5} />
                </div>
            </div>
            <div id="popup-container">
                <div ref={observedDiv} className="vertical-layout flex-align-center popup-content">
                    {children}
                </div>
            </div>
        </div>
    );
}

function PopupRoot({ isOpen, children }: { isOpen: boolean; children: ReactNode }) {
    useEffect(() => {
        isOpen
            ? document.querySelector("html")?.classList.add("hide-all")
            : document.querySelector("html")?.classList.remove("hide-all");
    }, [isOpen]);

    return (
        <div id="smoke-layer" className={`vertical-layout flex-align-middle flex-align-center`}>
            {isOpen && children}
        </div>
    );
}
