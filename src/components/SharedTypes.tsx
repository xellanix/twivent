export type Position = {
    x: number;
    y: number;
};

export type ReplacementParams = {
    [key: string]: {
        label: string;
        default: string;
        value: string;
    };
};
