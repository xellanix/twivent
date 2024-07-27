export type Position = {
    x: number;
    y: number;
};

export type Size = {
    width: number;
    height: number;
}

export type Rect = Position & Size;

export type ReplacementParams = {
    [key: string]: {
        label: string;
        default: string;
        value: string;
    };
};
