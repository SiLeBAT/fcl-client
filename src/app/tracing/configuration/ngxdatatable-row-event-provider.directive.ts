import {
    Directive,
    OnInit,
    AfterViewChecked,
    OnDestroy,
    EventEmitter,
    Output,
} from "@angular/core";
import { DatatableComponent } from "@siemens/ngx-datatable";
import { Subscription } from "rxjs";
import { TableRow } from "../data.model";

const EVENT_MOUSE_LEAVE = "mouseleave";
const EVENT_DBLCLICK = "dblclick";
const EVENT_MOUSE_ENTER = "mouseenter";

interface ActivateEvent {
    type: "mouseenter" | "keyboard" | "dblclick";
    event: any;
    row: TableRow;
    rowElement: any;
}

@Directive({
    selector: "[fclNgxDatatableRowEventProvider]",
})
export class NgxDatatableRowEventProviderDirective
    implements OnInit, AfterViewChecked, OnDestroy
{
    constructor(private host: DatatableComponent) {}

    @Output() rowDblClick = new EventEmitter<TableRow>();
    @Output() rowEnter = new EventEmitter<TableRow>();
    @Output() rowLeave = new EventEmitter<void>();
    @Output() rowOver = new EventEmitter<TableRow>();

    private tableActivateSubscription$: Subscription | null;
    private rowBelowMouse: TableRow | null = null;
    private rowElementBelowMouse: HTMLElement | null = null;
    private cachedRows: TableRow[] = [];

    private rowLeaveListener = () => this.onRowLeave();

    ngOnInit() {
        this.tableActivateSubscription$ = this.host.activate.subscribe(
            (event: ActivateEvent) => this.onCellActivate(event),
            (error: any) => {
                throw new Error(`error on table activate: ${error}`);
            },
        );
    }

    ngAfterViewChecked() {
        if (this.host.rows !== this.cachedRows) {
            this.cachedRows = this.host.rows;
            if (this.rowElementBelowMouse !== null) {
                this.onRowLeave();
            }
        }
    }

    ngOnDestroy(): void {
        if (this.tableActivateSubscription$) {
            this.tableActivateSubscription$.unsubscribe();
            this.tableActivateSubscription$ = null;
        }
        if (this.rowElementBelowMouse !== null) {
            this.clearRowReferences();
        }
    }

    private onRowLeave(): void {
        this.clearRowReferences();
        this.rowLeave.emit();
        this.triggerRowOverEventIfNecessary();
    }

    private triggerRowOverEventIfNecessary(): void {
        const lastRow = this.rowBelowMouse;
        setTimeout(() => {
            if (lastRow === this.rowBelowMouse) {
                this.rowOver.emit(this.rowBelowMouse!);
            }
        }, 0);
    }

    private clearRowReferences(): void {
        this.rowElementBelowMouse!.removeEventListener(
            EVENT_MOUSE_LEAVE,
            this.rowLeaveListener,
        );
        this.rowElementBelowMouse = null;
        this.rowBelowMouse = null;
    }

    private onRowEnter(row: TableRow, rowElement: HTMLElement): void {
        if (this.rowElementBelowMouse) {
            this.clearRowReferences();
            this.rowLeave.emit();
        }
        this.rowBelowMouse = row;
        this.rowElementBelowMouse = rowElement;
        this.rowElementBelowMouse.addEventListener(
            EVENT_MOUSE_LEAVE,
            this.rowLeaveListener,
        );
        this.rowEnter.emit(row);
        this.triggerRowOverEventIfNecessary();
    }

    private onCellActivate(event: ActivateEvent): void {
        if (event.type === EVENT_MOUSE_ENTER) {
            this.onRowEnter(event.row, event.rowElement);
        } else if (event.type === EVENT_DBLCLICK) {
            this.rowDblClick.emit(event.row);
        }
    }
}
