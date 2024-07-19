import { Position } from "./SharedTypes";

export const controllerWidth = 250;

export let twibbon = {
    width: 1080,
    height: 1080,
    sources: ["", ""] as unknown,
} as {
    width: number;
    height: number;
    sources: Map<string, string>;
};

export const getLatestTwibbonFolder = async () => {
    // Access all twibbon from github
    // https://api.github.com/repos/xellanix/twivent/contents/public/twibbon?ref=main

    const response = await fetch("https://api.github.com/repos/xellanix/twiproj/contents?ref=main");
    const data: Array<any> = await response.json();

    const last = data.filter((item: { type: string }) => item.type === "dir").pop();

    const url: string = last.url;

    return url;
};

export const getAllLayers = async (folder: string) => {
    const response = await fetch(folder);
    const data: Array<any> = await response.json();

    const reduced = data.reduce<Array<[string, string]>>(
        (filtered, item: { name: string; type: string; download_url: string }) => {
            const filename = item.name.match(/^[^.]+/);

            if (filename && item.type === "file")
                return filtered.concat([[filename[0], item.download_url]]);

            return filtered;
        },
        []
    );

    return new Map(reduced);
};

export const getAllLatestTwibbonLayers = async () => {
    const folder = await getLatestTwibbonFolder();
    return await getAllLayers(folder);
};

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
