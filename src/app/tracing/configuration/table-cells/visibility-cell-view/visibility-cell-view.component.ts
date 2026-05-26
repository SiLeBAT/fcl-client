import {
    Component,
    Input,
    ChangeDetectionStrategy,
    Output,
    EventEmitter,
    ChangeDetectorRef,
    OnDestroy,
    OnChanges,
    SimpleChanges,
} from "@angular/core";
import { TableRow } from "@app/tracing/data.model";
import { EVENT_TYPES } from "@app/tracing/shared/event.constants";

const KEYBOARD_EVENT_TYPES = [EVENT_TYPES.keydown, EVENT_TYPES.keyup];

@Component({
    selector: "fcl-visibility-cell-view",
    templateUrl: "./visibility-cell-view.component.html",
    styleUrls: ["./visibility-cell-view.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityCellViewComponent implements OnDestroy, OnChanges {
    @Input() row: TableRow | null = null;

    @Output() changeVisibility = new EventEmitter<void>();

    // workaround for events that change the tooltip
    // angular does not show/refreshes the tooltip if the mouse is already above
    // the span (between mouseenter and mouseleave)
    // so we toggle here between to identical span to mimic the mouseenter procedure
    activeSpan: 0 | 1 = 0;

    private shiftIsActive = false;
    private ctrlIsActive = false;

    private keyboardListener?: (event: KeyboardEvent) => void;

    private get actionDisabled(): boolean {
        return (
            this.row?.visibilityIsLocked === true ||
            this.row?.hideInGraph === true ||
            this.shiftIsActive ||
            this.ctrlIsActive
        );
    }

    get ngClass() {
        return {
            "fcl-pointable": !this.actionDisabled,
        };
    }

    get matTooltip(): string {
        if (this.actionDisabled) {
            if (this.row?.invisible === true) {
                return "Excluded from analysis.";
            }
            if (this.row?.hideInGraph === true) {
                return "Included in analysis, but hidden from view.";
            }
            return "";
        }
        if (this.row?.invisible) {
            return "Clear Invisibility - include into analysis.";
        }
        if (this.row?.hideInGraph) {
            return "Included in analysis, but hidden from view.";
        }
        return "Make invisible - exclude from analysis.";
    }

    constructor(private cdRef: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (
            changes.row &&
            !changes.row.firstChange &&
            this.row?.invisible !== changes.row.previousValue?.invisible
        ) {
            // we toggle the span here, because the tooltip might change
            this.toggleSpan();
        }
    }

    ngOnDestroy(): void {
        this.unregisterKeyboardListener();
    }

    onClick(event: MouseEvent): void {
        if (!this.actionDisabled && !event.ctrlKey && !event.shiftKey) {
            event.stopPropagation();
            this.changeVisibility.emit();
        }
    }

    onMouseEnter(event: MouseEvent): void {
        this.cacheMetaKeys(event);
        this.registerKeyboardListener();
    }

    onMouseLeave(event: MouseEvent): void {
        this.unregisterKeyboardListener();
    }

    private cacheMetaKeys(event: KeyboardEvent | MouseEvent): void {
        this.shiftIsActive = event.shiftKey;
        this.ctrlIsActive = event.metaKey || event.ctrlKey;
    }

    private registerKeyboardListener(): void {
        if (!this.keyboardListener) {
            this.keyboardListener = (event: KeyboardEvent) => {
                const tooltipBefore = this.matTooltip;
                this.cacheMetaKeys(event);
                this.cdRef.markForCheck();
                if (tooltipBefore === "" && this.matTooltip !== "") {
                    // we switch the span elements to enforce the showing of the tooltip
                    this.toggleSpan();
                }
            };
            KEYBOARD_EVENT_TYPES.forEach((type) =>
                window.addEventListener(type, this.keyboardListener!),
            );
        }
    }

    private unregisterKeyboardListener(): void {
        if (this.keyboardListener) {
            KEYBOARD_EVENT_TYPES.forEach((type) =>
                window.removeEventListener(type, this.keyboardListener!),
            );
            this.keyboardListener = undefined;
        }
    }

    private toggleSpan(): void {
        this.activeSpan = (1 - this.activeSpan) as 0 | 1;
    }
}
