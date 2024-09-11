import { Directive, ElementRef, AfterViewInit } from "@angular/core";

/**
 * This directive fixes a firefox issue.
 * Without it the user can use the tab to focus the multiline hint messages below the input fields
 * see ticket #619
 */
@Directive({
    selector: "[fclDisableSubscriptWrapperTabFocus]",
})
export class DisableSubscriptWrapperTabFocusDirective implements AfterViewInit {
    constructor(private hostElement: ElementRef) {}

    // lifecycle hooks start

    ngAfterViewInit(): void {
        this.disableSubscriptWrapperTabFocus();
    }
    // lifecycle hooks end

    private disableSubscriptWrapperTabFocus() {
        const children: HTMLDivElement[] =
            this.hostElement.nativeElement.querySelectorAll(
                ".mat-form-field-subscript-wrapper",
            );
        children.forEach((child) => (child.tabIndex = -1));
    }
}
