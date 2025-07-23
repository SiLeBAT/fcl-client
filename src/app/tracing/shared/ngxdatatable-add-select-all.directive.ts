import { Directive, ElementRef, OnInit, OnDestroy } from "@angular/core";
import { DatatableComponent } from "@siemens/ngx-datatable";
import { EVENT_TYPES } from "./event.constants";
import { CSS_CLASSES as NGXDATATABLE_CSS_CLASSES } from "./ngxdatatable.constants";

/**
 * This directive adds a ngx-datatable select all feature:
 * The usual select all rows command (ctrl + 'a' on win/linux resp. cmd + 'a' on macos)
 * is not conisdered in the used version of ngx-datatable
 */
@Directive({
    selector: "[fclNgxDatatableAddSelectAll]",
})
export class NgxDatatableAddSelectAllDirective implements OnInit, OnDestroy {
    private dtBodyElement: HTMLElement | undefined;

    constructor(
        private hostElement: ElementRef,
        private host: DatatableComponent,
    ) {}

    // lifecycle hooks start

    ngOnInit() {
        this.dtBodyElement =
            this.hostElement.nativeElement.getElementsByClassName(
                NGXDATATABLE_CSS_CLASSES.DATATABLE_BODY,
            )[0];
        this.dtBodyElement!.addEventListener(
            EVENT_TYPES.keydown,
            (event: KeyboardEvent) => {
                if (event.defaultPrevented) {
                    return;
                }
                if (!this.host.rows) {
                    return;
                }
                if (event.key === "a" && (event.ctrlKey || event.metaKey)) {
                    event.preventDefault();
                    window.getSelection()?.removeAllRanges();
                    this.host.select.emit({ selected: this.host.rows });
                    this.host.rows = this.host.rows.slice();
                }
            },
        );
    }

    ngOnDestroy(): void {
        this.dtBodyElement = undefined;
    }

    // lifecycle hooks end
}
