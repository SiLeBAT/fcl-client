import { Color, RGBAColor } from "../data.model";
export const COLORS = {
    shapeBorderGrey: { r: 135, g: 135, b: 135 },
    shapeFillColor: { r: 255, g: 0, b: 0, a: 0.2 } as RGBAColor,
} as const satisfies Record<string, Color>;

export const RGBA_COLORS = {
    shapeFillColor: { r: 255, g: 0, b: 0, a: 0.2 },
} as const satisfies Record<string, RGBAColor>;
