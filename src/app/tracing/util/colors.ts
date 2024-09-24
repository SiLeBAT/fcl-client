import { Color } from "../data.model";
export const COLORS = {
    primary_light: { r: 255, g: 255, b: 255 },
    primary_dark: { r: 0, g: 0, b: 0 },
} satisfies Record<string, Color>;


// naming based on https://www.smashingmagazine.com/2024/05/naming-best-practices/
// https://goodpractices.design/guidelines/naming/#colours 
// https://adobe.design/stories/design-for-scale/naming-colors-in-design-systems 