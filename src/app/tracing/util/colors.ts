import { Color } from "../data.model";
export const COLORS = {
    shapeBorderGrey: { r: 135, g: 135, b: 135 },
} as const satisfies Record<string, Color>;
