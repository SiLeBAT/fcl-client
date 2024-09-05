import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { TreeStatus } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-collapse-status-cell-view',
    templateUrl: './collapse-status-cell-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CollapseStatusCellViewComponent {

    @Input() status: TreeStatus | undefined = undefined;

    @Output() toggleStatus = new EventEmitter<void>();

    onToggleStatus(): void {
        this.toggleStatus.emit();
    }
}
