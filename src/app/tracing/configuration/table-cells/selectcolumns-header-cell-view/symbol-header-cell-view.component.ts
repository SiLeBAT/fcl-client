import {
    Component,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
} from "@angular/core";

@Component({
    selector: "fcl-symbol-header-cell-view",
    templateUrl: "./symbol-header-cell-view.component.html",
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisibilityFilterHeaderCellViewComponent {
    @Input() sortDir: any = undefined;

    @Output() sort = new EventEmitter<void>();

    onSort(): void {
        this.sort.emit();
    }
}
