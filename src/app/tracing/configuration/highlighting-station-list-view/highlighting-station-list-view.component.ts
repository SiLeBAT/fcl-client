import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Color, NodeShapeType, StationHighlightingData } from '@app/tracing/data.model';

interface StationHighlightingEntry {
    name: string;
    stationColor?: Color;
    shape?: NodeShapeType;
}

@Component({
    selector: 'fcl-highlighting-station-list-view',
    templateUrl: './highlighting-station-list-view.component.html',
    styleUrls: ['./highlighting-station-list-view.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class HighlightingStationListViewComponent implements OnInit {

    @Input() colorAndShapeHighlightings: StationHighlightingData[] = [];

    constructor() { }

    ngOnInit() { }
}
