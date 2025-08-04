import { Position, Rect, ReplacementParams, Size } from "./SharedTypes";

type TwibbonHeader = {
    title: string;
    subtitle: string;
};

type Caption = {
    template: string;
    params: ReplacementParams;
};

type TwibbonData = Size & {
    sources: Map<string, string> | null;
    totalLayer: number;
    caption: Caption | null;
    userPhotoConfig: {
        rect: Rect;
    };
};

type ControllerData = Size & {
    scale: number;
    centerPoint: Position;
};

type OptionalSize = {
    width?: number;
    height?: number;
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
    userPhotoConfig: {
        rect: { x: 0, y: 0, width: 1080, height: 1080 },
    },
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

export const getAllLatestTwibbonLayers = async () => {
    const folderData = await getLatestTwibbonFolder();
    return getAllLayersWithRaw(folderData[0]);
};

export const getAllLayersWithRaw = async (
    folder: string,
    progressHandler?: (current?: number, max?: number) => void,
    messageHandler?: (message: string) => void
): Promise<TwibbonHeader> => {
    // https://raw.githubusercontent.com/xellanix/twiproj/main/orkess3/layer1.png

    messageHandler?.("Fetching metadata...");
    const metadata = await (
        await fetch(
            `https://raw.githubusercontent.com/xellanix/twiproj/main/${folder}/metadata.json`
        )
    ).json();

    twibbon.width = metadata.width;
    twibbon.height = metadata.height;
    twibbon.caption = metadata.caption ?? null;

    const _mRectConfig = metadata?.userPhotoConfig?.rect || undefined;
    twibbon.userPhotoConfig.rect = {
        x: _mRectConfig?.x || 0,
        y: _mRectConfig?.y || 0,
        width: _mRectConfig?.width || twibbon.width,
        height: _mRectConfig?.height || twibbon.height,
    };

    controllerData.height =
        (controllerData.width * twibbon.userPhotoConfig.rect.height) /
        twibbon.userPhotoConfig.rect.width;
    controllerData.scale = twibbon.width / controllerData.width;

    const totalLayer = metadata.lastLayerIndex;
    const skipLayerIndexes: number[] = metadata.skipLayerIndexes || [];

    progressHandler && progressHandler(1, 1 + totalLayer * 3);

    const getStatus = async (i: number) => {
        const url = `https://raw.githubusercontent.com/xellanix/twiproj/main/${folder}/layer${i}`;
        try {
            messageHandler?.(`Fetching layer ${i}...`);

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
    for (let i = 1; i <= totalLayer; i++) {
        if (skipLayerIndexes.includes(i)) continue;

        const status = await getStatus(i);
        status && mapped.set(`layer${i}`, status);
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

const resizeRectFromAnchor = (rect: Rect, scale: number, anchorPoint: Position): Rect => {
    const gapWidth = (anchorPoint.x - rect.x) * scale;
    const gapHeight = (anchorPoint.y - rect.y) * scale;

    return {
        x: Math.round(anchorPoint.x - gapWidth),
        y: Math.round(anchorPoint.y - gapHeight),
        width: Math.round(rect.width * scale),
        height: Math.round(rect.height * scale),
    };
};

export const getCenterPosFromAnchor = (
    scale: number,
    returnAsScale: boolean,
    boundingBoxWidth: number,
    boundingBoxHeight: number,
    imageWidth: number,
    imageHeight: number,
    imageTop: number,
    imageLeft: number
) => {
    const anchorPoint = {
        x: boundingBoxWidth / 2,
        y: boundingBoxHeight / 2,
    };

    const rect = {
        x: imageLeft,
        y: imageTop,
        width: imageWidth,
        height: imageHeight,
    };

    let imageSize: OptionalSize = {};

    const newRect = resizeRectFromAnchor(rect, scale, anchorPoint);

    if (returnAsScale) {
        const boundingAspect = boundingBoxWidth / boundingBoxHeight;
        const imageAspect = newRect.width / newRect.height;

        if (imageAspect > boundingAspect) {
            imageSize = { height: scale };
        } else {
            imageSize = { width: scale };
        }
    } else {
        imageSize = newRect;
    }

    return {
        imagePosition: newRect,
        imageSize,
    };
};

export const getCenterPos = (
    scale: number,
    returnAsScale: boolean,
    boundingBoxWidth: number,
    boundingBoxHeight: number,
    imageWidth: number,
    imageHeight: number
) => {
    const boundingAspect = boundingBoxWidth / boundingBoxHeight;
    const imageAspect = imageWidth / imageHeight;

    let drawWidth, drawHeight, offsetX, offsetY;
    let imageSize: OptionalSize = {};

    if (imageAspect > boundingAspect) {
        drawHeight = (boundingBoxHeight * scale) / 100;
        drawWidth = (imageWidth * (boundingBoxHeight / imageHeight) * scale) / 100;

        if (returnAsScale) imageSize = { height: scale };
    } else {
        drawWidth = (boundingBoxWidth * scale) / 100;
        drawHeight = (imageHeight * (boundingBoxWidth / imageWidth) * scale) / 100;

        if (returnAsScale) imageSize = { width: scale };
    }

    offsetX = (boundingBoxWidth - drawWidth) / 2;
    offsetY = (boundingBoxHeight - drawHeight) / 2;

    if (!returnAsScale) imageSize = { width: drawWidth, height: drawHeight };

    return {
        imagePosition: { x: offsetX, y: offsetY } as Position,
        imageSize,
    };
};

export function isSamePosition(pos1: Position, pos2: Position): boolean {
    return pos1.x === pos2.x && pos1.y === pos2.y;
}

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
