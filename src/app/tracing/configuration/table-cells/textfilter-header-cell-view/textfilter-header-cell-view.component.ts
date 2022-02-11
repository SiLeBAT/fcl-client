import {
    Component, Input, Output, EventEmitter, ChangeDetectionStrategy
} from '@angular/core';
import { TableColumn } from '@app/tracing/data.model';
import * as _ from 'lodash';

@Component({
    selector: 'fcl-textfilter-header-cell-view',
    templateUrl: './textfilter-header-cell-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TextFilterHeaderCellViewComponent {

    @Input() column: TableColumn | null = null;
    @Input() filterText: string | null = '';
    @Input() sortDir: any = undefined;

    @Output() sort = new EventEmitter<void>();
    @Output() filterChange = new EventEmitter<string>();

    constructor() {}

    onSort(): void {
        this.sort.emit();
    }

    onFilterTextChange(filterText: string): void {
        this.filterChange.emit(filterText);
    }
}
