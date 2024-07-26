import { Position, ReplacementParams } from "./SharedTypes";

type TwibbonHeader = {
    title: string;
    subtitle: string;
};

type Caption = {
    template: string;
    params: ReplacementParams;
};

type TwibbonData = {
    width: number;
    height: number;
    sources: Map<string, string> | null;
    totalLayer: number;
    caption: Caption | null;
};

type ControllerData = {
    width: number;
    height: number;
    scale: number;
    centerPoint: Position;
};

export const pageUrl = () => window.location.origin + window.location.pathname;

export let controllerData: ControllerData = {
    width: 250,
    height: 250,
    scale: 1,
    centerPoint: { x: 0, y: 0 },
};

export let twibbon: TwibbonData = {
    width: 1080,
    height: 1080,
    sources: null,
    totalLayer: 0,
    caption: null,
};

export const getLatestTwibbonFolder = async () => {
    // Access all twibbon from github
    // https://api.github.com/repos/xellanix/twivent/contents/public/twibbon?ref=main

    const response = await fetch("https://api.github.com/repos/xellanix/twiproj/contents?ref=main");
    const data: Array<any> = await response.json();

    const last = data.filter((item: { type: string }) => item.type === "dir").pop();

    const url: string = last.url;

    return [last.name as string, url];
};

export const getAllLayers = async (folder: string): Promise<TwibbonHeader> => {
    const response = await fetch(folder);
    const data: Array<any> = await response.json();

    let metadataUrl = "";

    const reduced = data.reduce<Array<[string, string]>>(
        (filtered, item: { name: string; type: string; download_url: string }) => {
            const filename = item.name.match(/^[^.]+/);

            if (filename && item.type === "file") {
                const fn = filename[0];

                const int = parseInt(fn.replace(/\D/g, ""), 10);
                if (!isNaN(int) && int > twibbon.totalLayer) twibbon.totalLayer = int;

                if (fn === "metadata") {
                    metadataUrl = item.download_url;

                    return filtered;
                }

                return filtered.concat([[fn, item.download_url]]);
            }

            return filtered;
        },
        []
    );

    const metadata = await (await fetch(metadataUrl)).json();
    twibbon.width = metadata.width;
    twibbon.height = metadata.height;
    twibbon.caption = metadata.caption ?? null;
    controllerData.height = (controllerData.width * twibbon.height) / twibbon.width;
    controllerData.scale = twibbon.width / controllerData.width;

    twibbon.sources = new Map(reduced);

    return {
        title: metadata.title,
        subtitle: metadata.subtitle,
    };
};

export const getAllLatestTwibbonLayers = async () => {
    const folderData = await getLatestTwibbonFolder();
    return getAllLayersWithRaw(folderData[0]);
};

export const getAllLayersWithRaw = async (
    folder: string,
    progressHandler?: (current?: number, max?: number) => void,
    messageHandler?: any
): Promise<TwibbonHeader> => {
    // https://raw.githubusercontent.com/xellanix/twiproj/main/orkess3/layer1.png

    messageHandler("Fetching metadata...");
    const metadata = await (
        await fetch(
            `https://raw.githubusercontent.com/xellanix/twiproj/main/${folder}/metadata.json`
        )
    ).json();

    twibbon.width = metadata.width;
    twibbon.height = metadata.height;
    twibbon.caption = metadata.caption ?? null;

    controllerData.height = (controllerData.width * twibbon.height) / twibbon.width;
    controllerData.scale = twibbon.width / controllerData.width;

    const totalLayer = metadata.lastLayerIndex;

    progressHandler && progressHandler(1, 1 + totalLayer * 3);

    const getStatus = async (i: number) => {
        const url = `https://raw.githubusercontent.com/xellanix/twiproj/main/${folder}/layer${i}`;
        try {
            messageHandler(`Fetching layer ${i}...`);

            const png = await fetch(`${url}.png`);
            progressHandler && progressHandler(3 - (!png.ok ? 2 : 0));
            if (png.ok) return `${url}.png`;

            const jpg = await fetch(`${url}.jpg`);
            progressHandler && progressHandler(2 - (!jpg.ok ? 1 : 0));
            if (jpg.ok) return `${url}.jpg`;

            const jpeg = await fetch(`${url}.jpeg`);
            progressHandler && progressHandler(1);
            if (jpeg.ok) return `${url}.jpeg`;
        } catch {}

        return null;
    };

    let mapped = new Map<string, string>();
    for (let i = 0; i < totalLayer; i++) {
        const status = await getStatus(i + 1);

        status && mapped.set(`layer${i + 1}`, status);
    }

    twibbon.sources = mapped;
    twibbon.totalLayer = totalLayer;

    return { title: metadata.title, subtitle: metadata.subtitle };
};

export function makePreview(src: File, min: number) {
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

export const getCenterPos = (
    scale: number,
    useScale: boolean,
    canvasWidth: number,
    canvasHeight: number,
    w: number,
    h: number
) => {
    const canvasAspect = canvasWidth / canvasHeight;
    const imageAspect = w / h;

    let drawWidth, drawHeight, offsetX, offsetY;
    let imageSize: { w?: number; h?: number } = {};

    if (imageAspect > canvasAspect) {
        drawHeight = (canvasHeight * scale) / 100;
        drawWidth = (w * (canvasHeight / h) * scale) / 100;

        if (useScale) imageSize = { h: scale };
    } else {
        drawWidth = (canvasWidth * scale) / 100;
        drawHeight = (h * (canvasWidth / w) * scale) / 100;

        if (useScale) imageSize = { w: scale };
    }

    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = (canvasHeight - drawHeight) / 2;

    if (!useScale) imageSize = { w: drawWidth, h: drawHeight };

    return {
        imagePosition: { x: offsetX, y: offsetY } as Position,
        imageSize,
    };
};

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
