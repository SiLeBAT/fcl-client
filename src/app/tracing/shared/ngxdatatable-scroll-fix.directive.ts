import { Directive, ElementRef, OnInit, AfterViewChecked, OnDestroy } from '@angular/core';
import { DatatableComponent, TableColumn } from '@swimlane/ngx-datatable';
import { Size } from '../data.model';

const CLASS_DATATABLE_BODY = 'datatable-body';
const CLASS_DATATABLE_HEADER = 'datatable-header';
const CLASS_EMPTY_ROW = 'empty-row';
const CLASS_DATATABLE_ROW_CENTER = 'datatable-row-center';
const EVENT_SCROLL = 'scroll';

/**
 * This directive fixes 2 ngx-datatable issues:
 * 1. the empty table scroll problem (
 * if the table is empty the body cannot be scrolled horizontally anymore making it
 * impossible to scroll to columnheaders which are not in the viewport,
 * in an non empty table, becomes empty and non empty again the sync of columns and columnheader gets lost
 * )
 * 2. the scroll pos loss of tables in reactivated mat-tabs (
 * if the table is contained in a mat-tab, a non zero scroll pos gets lost after the tab is inactivated
 * (the user swithces to a different tab) and reactivated again,
 * the reactivated table might show rendering issues (missing rows)
 * )
 */
@Directive({
    selector: '[fclNgxDatatableScrollFix]'
})
export class NgxDatatableScrollFixDirective implements OnInit, AfterViewChecked, OnDestroy {

    private emptyRowElement: HTMLElement | null = null;
    private dtRowCenterElement: HTMLElement | null = null;
    private dtHeaderElement: HTMLElement | null = null;
    private dtBodyElement: HTMLElement | null = null;
    private lastRowCount: number = -1;
    private lastColumns: TableColumn[] = [];

    private lastWidth: number = null;
    private lastBodyScrollPosition = {
        top: 0,
        left: 0
    };

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

        // fix of scroll behaviour within mat-tab
        // positive scroll positions are lost after switching the mat-tab container to inactiv
        // and back to activ
        // the reason is probably the zero width of the ngx-datatable within the inactiv mat-tab
        if (this.dtBodyElement) {
            const elementRect: Size = this.hostElement.nativeElement.getBoundingClientRect();
            const oldScrollPos = this.lastBodyScrollPosition;
            if (elementRect.width > 0) {
                // container mat tab is active
                // in an inactive mat tab ngx datatable has a width of 0
                if (this.lastWidth !== null && this.lastWidth === 0) {
                    // ngx datatable width was 0 on last check
                    if (
                        this.lastColumns === this.host.columns &&
                        (oldScrollPos.top !== 0 || oldScrollPos.left !== 0)
                    ) {
                        // columns did not changed
                        // last scroll pos on was not 0, 0
                        // restore scroll pos
                        this.dtBodyElement.scrollTo(oldScrollPos.left, oldScrollPos.top);
                    }
                } else {
                    // store scroll pos & last columns
                    this.lastColumns = this.host.columns;
                    this.lastBodyScrollPosition = {
                        top: this.dtBodyElement.scrollTop,
                        left: this.dtBodyElement.scrollLeft
                    };
                }
            }
            // store last width
            this.lastWidth = elementRect.width;
        }
    }

    ngOnDestroy(): void {
        this.unsetElementRefs();
        this.dtHeaderElement = null;
        this.dtBodyElement = null;
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
