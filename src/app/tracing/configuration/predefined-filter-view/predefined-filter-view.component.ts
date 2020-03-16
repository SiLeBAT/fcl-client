import { Component, OnInit, Input, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { TableSettings, ShowType } from '../../data.model';

export interface PredefinedLabelConfig {
    value: string;
    label: string;
}

@Component({
    selector: 'fcl-predefined-filter-view',
    templateUrl: './predefined-filter-view.component.html',
    styleUrls: ['./predefined-filter-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PredefinedFilterViewComponent implements OnInit {
    @Input() showTypes: string[];
    @Input() tableSettings: TableSettings;
    @Output() newShowType = new EventEmitter<ShowType>();

    constructor() { }

    ngOnInit() { }

    setTableShowType(event: MatSelectChange) {
        this.newShowType.emit(event.value);
    }

}
