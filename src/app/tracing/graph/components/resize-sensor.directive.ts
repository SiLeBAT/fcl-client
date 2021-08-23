import { Directive, Output, EventEmitter, ElementRef, AfterViewChecked, AfterViewInit, Input } from '@angular/core';
import { Size } from '@app/tracing/data.model';

@Directive({
    selector: '[fclResizeSensor]'
})
export class ResizeSensorDirective implements AfterViewChecked, AfterViewInit {

    @Input() ignoreWindowResize = false;
    @Input() ignoreNonPositiveResize = false;

    @Output() resized = new EventEmitter();

    private elementSize: Size;
    private windowSize: Size;

    constructor(private elementRef: ElementRef) { }

    ngAfterViewInit(): void {
        this.elementSize = this.getCurrentElementSize();
        this.windowSize = this.getCurrentWindowSize();
    }

    private getCurrentElementSize(): Size {
        const clientRect: Size = this.elementRef.nativeElement.getBoundingClientRect();
        return {
            width: clientRect.width,
            height: clientRect.height
        };
    }

    private getCurrentWindowSize(): Size {
        return {
            height: window.innerHeight,
            width: window.innerWidth
        };
    }

    ngAfterViewChecked(): void {
        this.emitResizeEventIfNecessary();
    }

    private emitResizeEventIfNecessary() {
        const newElementSize = this.getCurrentElementSize();
        const oldWindowSize = this.windowSize;
        this.windowSize = this.getCurrentWindowSize();
        if (this.isSizeDifferent(this.elementSize, newElementSize)) {
            if (!this.ignoreNonPositiveResize || !this.isNonPositiveSize(newElementSize)) {
                this.elementSize = newElementSize;
                if (!this.ignoreWindowResize || !this.isSizeDifferent(oldWindowSize, this.windowSize)) {
                    this.resized.emit();
                }
            }
        }
    }

    private isSizeDifferent(size1: Size, size2: Size): boolean {
        return !(
            this.areValuesQuasiEqual(size1.width, size2.width) &&
            this.areValuesQuasiEqual(size1.height, size2.height)
        );
    }

    private getRelativeDifference(value1: number, value2: number): number {
        const maxAbsValue = Math.max(Math.abs(value1), Math.abs(value2));
        const diff = Math.abs(value1 - value2);
        return diff === 0 ? 0 : diff / maxAbsValue;
    }

    private areValuesQuasiEqual(value1: number, value2: number): boolean {
        return this.getRelativeDifference(value1, value2) < 1e-6;
    }

    private isNonPositiveSize(size: Size): boolean {
        return size.width === 0 || size.height === 0;
    }
}
