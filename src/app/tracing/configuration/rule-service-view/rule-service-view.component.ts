import { Component, Output, EventEmitter, ChangeDetectionStrategy, Input } from '@angular/core';

@Component({
    selector: 'fcl-rule-service-view',
    templateUrl: './rule-service-view.component.html',
    styleUrls: ['./rule-service-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class RuleServiceViewComponent {

    @Input() disabled = false;

    @Output() addSelection = new EventEmitter<void>();
    @Output() removeSelection = new EventEmitter<void>();

    onAddSelectionClick(): void {
        this.addSelection.emit();
    }

    onRemoveSelectionClick(): void {
        this.removeSelection.emit();
    }
}
