import {
    Component, Input, Output, EventEmitter, ChangeDetectionStrategy
} from '@angular/core';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-visibilityfilter-header-cell-view',
    templateUrl: './visibilityfilter-header-cell-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisibilityFilterHeaderCellViewComponent {

    @Input() showVisibleElements = true;
    @Input() showInvisibleElements = true;
    @Input() sortDir: any = undefined;

    @Output() sort = new EventEmitter<void>();
    @Output() toggleFilterState = new EventEmitter<void>();

    constructor() {}

    onSort(): void {
        this.sort.emit();
    }

    onToggleFilterState(): void {
        this.toggleFilterState.emit();
    }
}
