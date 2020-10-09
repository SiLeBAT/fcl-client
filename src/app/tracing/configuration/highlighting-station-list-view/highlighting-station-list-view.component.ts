import { Component, Input, ViewEncapsulation } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-highlighting-station-list-view',
    templateUrl: './highlighting-station-list-view.component.html',
    styleUrls: ['./highlighting-station-list-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HighlightingStationListViewComponent {

    @Input() colorAndShapeHighlightings: StationHighlightingData[] = [];

}
