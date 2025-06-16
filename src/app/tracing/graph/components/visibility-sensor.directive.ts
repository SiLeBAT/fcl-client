import {
    Directive,
    Output,
    EventEmitter,
    ElementRef,
    AfterViewInit,
    OnDestroy,
} from "@angular/core";
import { isElementVisible } from "@app/tracing/util/dom-utils";

@Directive({
    selector: "[fclVisibilitySensor]",
})
export class VisibilitySensorDirective implements AfterViewInit, OnDestroy {
    @Output() visibilityChange = new EventEmitter<boolean>();

    private lastVisibility = false;
    private intersectionObserver: IntersectionObserver | null = null;

    constructor(private elementRef: ElementRef) {}

    ngAfterViewInit(): void {
        this.lastVisibility = isElementVisible(this.elementRef.nativeElement);
        this.initObserver();
    }

    ngOnDestroy(): void {
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }
    }

    private initObserver() {
        const observerOptions: IntersectionObserverInit = {
            root: null,
            rootMargin: "0px",
            threshold: 0.0,
        };

        const callback: IntersectionObserverCallback = (entries) => {
            const currentVisibility = entries.some((e) => e.isIntersecting);
            if (currentVisibility !== this.lastVisibility) {
                this.visibilityChange.emit(currentVisibility);
            }
            this.lastVisibility = currentVisibility;
        };

        this.intersectionObserver = new IntersectionObserver(
            callback,
            observerOptions,
        );
        this.intersectionObserver.observe(this.elementRef.nativeElement);
    }
}
