import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
    selector: "fcl-row-cell-view",
    template: "{{ value }}",
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false,
})
export class RowCellViewComponent {
    @Input() value: string | boolean | number | null | undefined = "";
}
