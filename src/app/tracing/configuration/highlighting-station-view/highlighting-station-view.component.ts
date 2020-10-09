import { Component, Input, OnInit } from '@angular/core';
import { StationHighlightingData } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-highlighting-station-view',
    templateUrl: './highlighting-station-view.component.html',
    styleUrls: ['./highlighting-station-view.component.scss']
})
export class HighlightingStationViewComponent implements OnInit {
    @Input() colorAndShapeHighlightings: StationHighlightingData[];

    labelsOpenState = false;
    stationSizeOpenState = false;
    coloursAndShapesOpenState = false;

    constructor() { }

    ngOnInit() { }

}
