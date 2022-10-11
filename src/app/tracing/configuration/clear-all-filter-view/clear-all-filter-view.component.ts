import { Component, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'fcl-clear-all-filter-view',
    templateUrl: './clear-all-filter-view.component.html',
    styleUrls: ['./clear-all-filter-view.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClearAllFilterViewComponent {
    @Output() clearFilter = new EventEmitter();

    clearAllFilter() {
        this.clearFilter.emit();
    }

}
