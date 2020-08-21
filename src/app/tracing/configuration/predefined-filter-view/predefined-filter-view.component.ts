import { Component, OnInit, Input, ViewEncapsulation, EventEmitter, Output } from '@angular/core';
import { ShowType } from '../configuration.model';

@Component({
    selector: 'fcl-predefined-filter-view',
    templateUrl: './predefined-filter-view.component.html',
    styleUrls: ['./predefined-filter-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class PredefinedFilterViewComponent implements OnInit {

    @Input() showType: ShowType;

    @Output() showTypeChange = new EventEmitter<ShowType>();

    showTypes: ShowType[] = [ShowType.ALL, ShowType.SELECTED_ONLY, ShowType.TRACE_ONLY];

    showTypeLabelMap: { [key in ShowType]: string } = {
        [ShowType.ALL]: 'Show all',
        [ShowType.SELECTED_ONLY]: 'Show only selected',
        [ShowType.TRACE_ONLY]: 'Show only traced'
    };

    constructor() { }

    ngOnInit() { }

    onSetShowType(showType: ShowType) {
        this.showType = showType;
        this.showTypeChange.emit(showType);
    }
}
