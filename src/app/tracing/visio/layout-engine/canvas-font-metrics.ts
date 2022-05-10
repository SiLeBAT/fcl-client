import * as _ from 'lodash';
import { GraphSettings } from './graph-settings';
import { FontMetrics } from './datatypes';

interface TextMetrics {
    width: number;
    fontBoundingBoxAscent: number;
    fontBoundingBoxDescent: number;
    actualBoundingBoxAscent: number;
    actualBoundingBoxDescent: number;
    alphabeticBaseline: number;
}

interface Context {
    font: string;   // e.g. 'bold 48px serif'
    textBaseline: string;
    measureText(text: string): TextMetrics;
}

interface Canvas {
    getContext(x: string): Context;
}

export class CanvasFontMetrics implements FontMetrics {

    private context: Context;
    private lineSpace: number;
    private lineHeight: number;

    constructor(canvas: Canvas) {
        this.context = canvas.getContext('2d');
        this.context.font = GraphSettings.FONT_SIZE + ' ' + GraphSettings.FONT_NAME;
        const textSample = 'Abcdefghij';
        const metrics: TextMetrics = this.context.measureText(textSample);
        this.lineSpace = metrics.fontBoundingBoxDescent - metrics.alphabeticBaseline;
        this.lineHeight = metrics.fontBoundingBoxDescent - metrics.fontBoundingBoxAscent;
    }

    measureTextWidth(text: string[]): number {
        return Math.max(...text.map(t => this.context.measureText(t).width));
    }

    measureText(text: string[]): {width: number; height: number} {
        const sizes = text.map(t => this.context.measureText(t));
        return {
            width: Math.max(...sizes.map(s => s.width)),
            height: text.length * this.lineHeight + Math.max(0, text.length - 1) * this.lineSpace
        };
    }
}
