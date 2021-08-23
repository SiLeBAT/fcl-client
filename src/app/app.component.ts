import { Component, ElementRef } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

@Component({
    selector: 'fcl-root',
    templateUrl: './app.component.html'
})
export class AppComponent {

    constructor(
        private overlayContainer: OverlayContainer,
        private elementRef: ElementRef
    ) {
        // Disables all default context menus in webapp
        (this.elementRef.nativeElement as HTMLElement).oncontextmenu = e => e.preventDefault();
        this.overlayContainer.getContainerElement().oncontextmenu = e => e.preventDefault();
    }
}
