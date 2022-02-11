import {
    Directive, ElementRef, OnInit, AfterViewChecked, OnDestroy, Input, ChangeDetectorRef, DoCheck
} from '@angular/core';
import { DatatableComponent, TableColumn } from '@swimlane/ngx-datatable';
import { Observable, Subscription } from 'rxjs';
import { ActivityState } from '../configuration/configuration.model';
import { Size } from '../data.model';

const CLASS_DATATABLE_BODY = 'datatable-body';
const CLASS_DATATABLE_HEADER = 'datatable-header';
const CLASS_EMPTY_ROW = 'empty-row';
const CLASS_DATATABLE_ROW_CENTER = 'datatable-row-center';
const EVENT_SCROLL = 'scroll';

interface ScrollPosition {
    left: number;
    top: number;
}

/**
 * This directive fixes 2 ngx-datatable issues:
 * 1. the empty table scroll problem (
 * if the table is empty the body cannot be scrolled horizontally anymore making it
 * impossible to scroll to columnheaders which are not in the viewport,
 * in an non empty table, becomes empty and non empty again the sync of columns and columnheader gets lost
 * )
 * 2. the scroll pos loss of tables in reactivated mat-tabs (
 * if the table is contained in a mat-tab, a non zero scroll pos gets lost after the tab is inactivated
 * (the user switches to a different tab) and reactivated again,
 * the reactivated table might show rendering issues (missing rows)
 * )
 */
@Directive({
    selector: '[fclNgxDatatableScrollFix]'
})
export class NgxDatatableScrollFixDirective implements OnInit, AfterViewChecked, OnDestroy, DoCheck {

    private emptyRowElement: HTMLElement | null = null;
    private dtRowCenterElement: HTMLElement | null = null;
    private dtHeaderElement: HTMLElement | null = null;
    private dtBodyElement: HTMLElement | null = null;
    private lastRowCount: number = -1;
    private lastColumns: TableColumn[] = [];

    private lastBodyScrollPosition: ScrollPosition = {
        top: 0,
        left: 0
    };

    @Input() activityState$: Observable<ActivityState> | null = null;
    @Input() cycleStart$: Observable<void> | null = null;

    private restoreScrollPosOnPosWidth = false;
    private activityState_ = ActivityState.OPEN;
    private subscriptions_: Subscription[] = [];

    constructor(
        private hostElement: ElementRef,
        private host: DatatableComponent,
        private cdRef: ChangeDetectorRef
    ) {}

    // lifecycle hooks start

    ngOnInit() {
        this.dtBodyElement = this.hostElement.nativeElement.getElementsByClassName(CLASS_DATATABLE_BODY)[0];
        this.dtBodyElement.addEventListener(
            EVENT_SCROLL,
            () => {
                this.captureScrollState();
                if (this.host.rows && this.host.rows.length === 0) {
                    // 'No data available.' placeholder is shown
                    // this event is sent to sync column and row offset
                    this.host.onBodyScroll({
                        offsetX: this.dtBodyElement.scrollLeft,
                        offsetY: this.dtBodyElement.scrollTop
                    } as any);
                }
            }
        );
        if (this.activityState$ !== null && this.activityState$ !== undefined) {
            this.subscriptions_.push(this.activityState$.subscribe(
                (state) => this.setActivityState(state),
                () => {}
            ));
        }
        if (this.cycleStart$ !== null && this.cycleStart$ !== undefined) {
            this.subscriptions_.push(this.cycleStart$.subscribe(
                () => {
                    if (this.activityState_ !== ActivityState.INACTIVE && this.restoreScrollPosOnPosWidth) {
                        this.cdRef.markForCheck();
                    }
                },
                () => {}
            ));
        }
    }

    ngDoCheck(): void {
        if (this.restoreScrollPosOnPosWidth) {
            this.restoreScrollPosOnPosWidth = this.isScrollPosRestoreRequired();
        }
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
            if (this.restoreScrollPosOnPosWidth) {

                const tableSize: Size = this.getSize();

                if (tableSize.width > 0) {
                    this.restoreScrollPos();
                }
            }
        }
    }

    ngOnDestroy(): void {
        this.unsetElementRefs();
        this.dtHeaderElement = null;
        this.dtBodyElement = null;
        this.subscriptions_.forEach(s => s.unsubscribe());
        this.subscriptions_ = [];
    }

    // lifecycle hooks end

    private setActivityState(state: ActivityState): void {
        if (state !== this.activityState_) {
            if (this.activityState_ === ActivityState.INACTIVE) {
                this.restoreScrollPosOnPosWidth = this.isScrollPosRestoreRequired();
            }
            this.activityState_ = state;
            if (state !== ActivityState.INACTIVE && this.restoreScrollPosOnPosWidth) {
                this.cdRef.markForCheck();
            }
        }
    }

    private isScrollPosRestoreRequired(): boolean {
        return (
            this.lastColumns === this.host.columns &&
            (this.lastBodyScrollPosition.top !== 0 || this.lastBodyScrollPosition.left !== 0)
        );
    }

    private getSize(): Size {
        return this.hostElement.nativeElement.getBoundingClientRect();
    }

    private captureScrollState(): void {
        this.lastColumns = this.host.columns;
        this.lastBodyScrollPosition = {
            top: this.dtBodyElement.scrollTop,
            left: this.dtBodyElement.scrollLeft
        };
    }

    private restoreScrollPos(): void {
        this.restoreScrollPosOnPosWidth = false;
        this.dtBodyElement.scrollTo(this.lastBodyScrollPosition.left, this.lastBodyScrollPosition.top);
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
                () => {
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
