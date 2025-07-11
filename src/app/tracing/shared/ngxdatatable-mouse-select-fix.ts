import { Directive, OnInit, OnDestroy } from "@angular/core";
import {
    DatatableComponent,
    TableColumn as NgxTableColumn,
} from "@siemens/ngx-datatable";
import { Subscription } from "rxjs";
import { TableRow } from "../data.model";
import { EVENT_TYPES } from "./event.constants";

interface TableActivationEvent {
    type: "keydown" | "click" | "dblclick";
    event: MouseEvent | KeyboardEvent;
    row?: TableRow;
    column?: NgxTableColumn;
    value?: any;
    cellElement?: HTMLElement;
    rowElement?: HTMLElement;
}

/**
 * This directive fixes an mouse select (with shift key) issue:
 * If the user wants to select a range of rows with the mouse and he uses shift key
 * to span the range the the text of the rows in the ranges is selected also,
 *
 * To undo the text selection the window selection is discarded if an click activation event
 * occured and the shift key is pressed and at least 2 rows are selected
 */
@Directive({
    selector: "[fclNgxDatatableMouseSelectFix]",
})
export class NgxDatatableMouseSelectFixDirective implements OnInit, OnDestroy {
    private subscriptions_: Subscription[] = [];

    constructor(private host: DatatableComponent) {}

    // lifecycle hooks start

    ngOnInit() {
        this.subscriptions_.push(
            this.host.activate.subscribe((event) => {
                this.onTableActivate(event);
            }),
        );
    }

    ngOnDestroy(): void {
        this.subscriptions_.forEach((s) => s.unsubscribe());
        this.subscriptions_ = [];
    }

    // lifecycle hooks end

    private onTableActivate(event: TableActivationEvent): void {
        if (
            event.type === EVENT_TYPES.click &&
            (event.event as MouseEvent).shiftKey &&
            event.rowElement
        ) {
            if (this.host.selected.length > 1) {
                window.getSelection()?.removeAllRanges();
            }
        }
    }
}
