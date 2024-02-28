
export class TempCanvas {

    private canvas_: HTMLCanvasElement | undefined;

    constructor() {
        this.createCanvas();
    }

    getCanvasElement(): HTMLCanvasElement | undefined {
        return this.canvas_;
    }

    destroy(): void {
        this.destroyCanvas();
    }

    private createCanvas(): void {
        const canvas = document.createElement('canvas');
        canvas.style.position = 'absolute';
        canvas.style.visibility = 'hidden';
        this.getBody().appendChild(canvas);
        this.canvas_ = canvas;
    }

    private destroyCanvas(): void {
        if (this.canvas_) {
            this.getBody().removeChild(this.canvas_);
            this.canvas_ = undefined;
        }
    }

    private getBody(): HTMLBodyElement {
        return document.getElementsByTagName('body')[0];
    }
}
