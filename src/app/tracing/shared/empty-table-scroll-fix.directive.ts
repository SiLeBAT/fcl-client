import { Directive, ElementRef, OnInit, AfterViewChecked, OnDestroy, AfterContentInit } from '@angular/core';
import { DatatableComponent } from '@swimlane/ngx-datatable';

const CLASS_DATATABLE_BODY = 'datatable-body';
const CLASS_DATATABLE_HEADER = 'datatable-header';
const CLASS_EMPTY_ROW = 'empty-row';
const CLASS_DATATABLE_ROW_CENTER = 'datatable-row-center';
const EVENT_SCROLL = 'scroll';

@Directive({
    selector: '[fclEmptyTableScrollFix]'
})
export class EmptyTableScrollFixDirective implements OnInit, AfterViewChecked, OnDestroy {

    private emptyRowElement: HTMLElement | null = null;
    private dtRowCenterElement: HTMLElement | null = null;
    private dtHeaderElement: HTMLElement | null = null;
    private dtBodyElement: HTMLElement | null = null;
    private lastRowCount: number = -1;

    constructor(
        private hostElement: ElementRef,
        private host: DatatableComponent
    ) {}

    ngOnInit() {
        this.dtBodyElement = this.hostElement.nativeElement.getElementsByClassName(CLASS_DATATABLE_BODY)[0];
        this.dtBodyElement.addEventListener(
            EVENT_SCROLL,
            event => {
                if (this.host.rows && this.host.rows.length === 0) {
                    // 'No data available.' placeholder is shown
                    this.host.onBodyScroll({
                        offsetX: this.dtBodyElement.scrollLeft,
                        offsetY: this.dtBodyElement.scrollTop
                    } as any);
                }
            }
        );
    }

    ngAfterViewChecked() {
        if (this.dtHeaderElement === null) {
            this.setHeaderElement();
        }

        if (this.host.rows !== undefined) {
            const newRowCount = this.host.rows.length;

            if (newRowCount === 0) {
                if (this.lastRowCount !== newRowCount) {
                    this.setElementRefs();
                }
                if (this.emptyRowElement !== null && this.dtRowCenterElement !== null) {
                    this.emptyRowElement.style.width = this.dtRowCenterElement.style.width;
                }
            } else if (this.lastRowCount === 0) {
                this.unsetElementRefs();
            }
            this.lastRowCount = newRowCount;
        }
    }

    ngOnDestroy(): void {
        this.unsetElementRefs();
    }

    private unsetElementRefs(): void {
        this.dtRowCenterElement = null;
        this.emptyRowElement = null;
    }

    private setElementRefs(): void {
        const emptyRowElements = this.hostElement.nativeElement.getElementsByClassName(CLASS_EMPTY_ROW);
        if (emptyRowElements.length > 0) {
            this.emptyRowElement = emptyRowElements[0];
        }
        const dtRowCenterElements = this.hostElement.nativeElement.getElementsByClassName(CLASS_DATATABLE_ROW_CENTER);
        if (dtRowCenterElements.length > 0) {
            this.dtRowCenterElement = dtRowCenterElements[0];
        }
    }

    private setHeaderElement(): void {
        const dtHeaders = this.hostElement.nativeElement.getElementsByClassName(CLASS_DATATABLE_HEADER);
        if (dtHeaders[0] !== undefined) {
            this.dtHeaderElement = dtHeaders[0];
            this.dtHeaderElement.addEventListener(
                EVENT_SCROLL,
                event => {
                    const scrollLeft = this.dtHeaderElement.scrollLeft;
                    if (scrollLeft !== 0) {
                        this.dtHeaderElement.scrollTo(0, this.dtHeaderElement.scrollTop);
                        this.dtBodyElement.scrollTo(
                            this.dtBodyElement.scrollLeft + scrollLeft,
                            this.dtBodyElement.scrollTop
                        );
                    }
                }
            );
        }
    }
}
