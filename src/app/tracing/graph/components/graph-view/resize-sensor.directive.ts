import { Directive, HostListener, Output, EventEmitter, ElementRef, AfterViewChecked, AfterViewInit } from '@angular/core';
import { Size } from '@app/tracing/data.model';

@Directive({
    selector: '[fclResizeSensor]'
})
export class ResizeSensorDirective implements AfterViewChecked, AfterViewInit {
    /// Event Emitter used to communicate the act of scratching to the dog
    @Output() resized = new EventEmitter();

    // private windowSize: Size; //  = { width: undefined, height: undefined };
    private elementSize: Size; // = { width: undefined, height: undefined };

    /// our click is a representation of a scratch
    // @HostListener('window:resize')
    // onWindowResize() {
    //     // console.log('ResizeSensorDirective.onWindowResize entered ...');
    //     this.emitResizeEventIfNecessary();
    // }

    constructor(private elementRef: ElementRef) { }

    ngAfterViewInit(): void {
        this.setElementSize();
    }

    private setElementSize(): void {
        const clientRect: Size = this.elementRef.nativeElement.getBoundingClientRect();
        this.elementSize = {
            width: clientRect.width,
            height: clientRect.height
        };
    }

    private didElementSizeChanged(): boolean {
        const clientRect: Size = this.elementRef.nativeElement.getBoundingClientRect();
        return this.elementSize && (
            clientRect.height !== this.elementSize.height ||
            clientRect.width !== this.elementSize.width
        );
    }

    ngAfterViewChecked(): void {
        this.emitResizeEventIfNecessary();
    }

    private emitResizeEventIfNecessary() {
        if (this.didElementSizeChanged()) {
            const oldSize = this.elementSize;
            this.setElementSize();
            this.resized.emit();
        }
    }

    private isElementVisible(): boolean {
        // works only if there are no 'position: fixed' elements on the page
        return this.elementRef.nativeElement.offsetParent !== null;
    }
}
