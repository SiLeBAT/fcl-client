import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { TableRow } from '@app/tracing/data.model';
import { Constants } from '@app/tracing/util/constants';

@Component({
    selector: 'fcl-symbol-cell-view',
    templateUrl: './symbol-cell-view.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SymbolCellViewComponent {

    @Input() row: TableRow | null = null;

    readonly invisibleColor = Constants.INVISIBLE_COLOR;

}
