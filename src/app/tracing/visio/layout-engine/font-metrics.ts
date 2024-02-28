import { FontMetrics, StyleOptions } from './datatypes';
import { GraphSettings } from './graph-settings';

const BOLD_FONT_SCALE_FACTOR = 1.25;
const MEAN_CHARACTER_WIDTH = 4.4;
const LINE_HEIGHT = 10;

export function getFontMetrics(canvas: HTMLCanvasElement | undefined): FontMetrics {
    if (canvas) {
        const fontSuffix = `${GraphSettings.FONT_SIZE}px ${GraphSettings.FONT_NAME}`;
        const font = (bold: boolean) => `${bold ? 'bold ' : ''}${fontSuffix}`;
        const ctx = canvas.getContext('2d');

        const measureTextWidth = (text: string[], options?: StyleOptions) => {
            const curFont = font(options && options.bold === true);
            ctx.font = font(options && options.bold === true);
            return Math.max(...text.map(t => ctx.measureText(t).width));
        };
        const measureTextHeight = (text: string[], options?: StyleOptions) => {
            ctx.font = font(options && options.bold === true);
            const metrics = ctx.measureText(text[0]);
            const fontHeight = metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent;
            return fontHeight * text.length;
        };
        return {
            measureTextWidth: measureTextWidth,
            measureText: (text: string[], options?: StyleOptions) => ({
                width: measureTextWidth(text, options),
                height: measureTextHeight(text, options)
            })
        };
    } else {
        const measureTextWidth = (text: string[], options?: StyleOptions) =>
            Math.max(1, ...text.map(t => t.length)) * MEAN_CHARACTER_WIDTH * ((options && options.bold) ? BOLD_FONT_SCALE_FACTOR : 1);
        return {
            measureTextWidth: measureTextWidth,
            measureText: (text: string[], options?: StyleOptions) => ({
                width: measureTextWidth(text),
                height: LINE_HEIGHT * text.length
            })
        };
    }
}
