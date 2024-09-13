import { FontMetrics, StyleOptions } from "./datatypes";
import { GraphSettings } from "./graph-settings";

const BOLD_FONT_SCALE_FACTOR = 1.25;
const MEAN_CHARACTER_WIDTH = 4.4;
const LINE_HEIGHT = 10;
const MEASRURE_HEIGHT_REF_TEXT = "Ûg";

function getCanvasRenderingFontHeight(ctx: CanvasRenderingContext2D): number {
    const metrics = ctx.measureText(MEASRURE_HEIGHT_REF_TEXT);
    let fontHeight =
        metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
    // this height is supposed to be text independent
    if (isNaN(fontHeight)) {
        // the fontBoundingBox*scent measures are text unspecific but are not provided by
        // all browsers (or versions), so we use here (the text specific)
        // actualBoundingBox*scent measures instead.
        // for font Verdana both measures are very similar for the given reference text
        fontHeight = Math.round(
            metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        );
    }
    return fontHeight;
}

function getHeuristicBasedFontMetrics(): FontMetrics {
    const measureTextWidth = (text: string[], options?: StyleOptions) =>
        Math.max(1, ...text.map((t) => t.length)) *
        MEAN_CHARACTER_WIDTH *
        (options && options.bold ? BOLD_FONT_SCALE_FACTOR : 1);
    return {
        measureTextWidth: measureTextWidth,
        measureText: (text: string[], options?: StyleOptions) => ({
            width: measureTextWidth(text),
            height: LINE_HEIGHT * text.length,
        }),
    };
}

function getCanvasBasedFontMetrics(ctx: CanvasRenderingContext2D): FontMetrics {
    const fontSuffix = `${GraphSettings.FONT_SIZE}px ${GraphSettings.FONT_NAME}`;
    const font = (bold: boolean) => `${bold ? "bold " : ""}${fontSuffix}`;

    const measureTextWidth = (text: string[], options?: StyleOptions) => {
        ctx.font = font(!!options && options.bold === true);
        return Math.max(...text.map((t) => ctx.measureText(t).width));
    };

    ctx.font = font(false);
    const normalFontHeight = getCanvasRenderingFontHeight(ctx);
    ctx.font = font(true);
    const boldFontHeight = getCanvasRenderingFontHeight(ctx);

    const measureTextHeight = (text: string[], options?: StyleOptions) => {
        const fontHeight = options?.bold ? boldFontHeight : normalFontHeight;
        return fontHeight * text.length;
    };
    return {
        measureTextWidth: measureTextWidth,
        measureText: (text: string[], options?: StyleOptions) => ({
            width: measureTextWidth(text, options),
            height: measureTextHeight(text, options),
        }),
    };
}

export function getFontMetrics(
    canvas: HTMLCanvasElement | undefined,
): FontMetrics {
    if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
            return getCanvasBasedFontMetrics(ctx);
        }
    }
    return getHeuristicBasedFontMetrics();
}
