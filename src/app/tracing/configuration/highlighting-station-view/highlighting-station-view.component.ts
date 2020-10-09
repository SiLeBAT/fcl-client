import { Component, Input, OnInit } from '@angular/core';
import { LegendInfo } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-highlighting-station-view',
    templateUrl: './highlighting-station-view.component.html',
    styleUrls: ['./highlighting-station-view.component.scss']
})
export class HighlightingStationViewComponent implements OnInit {
    @Input() highlightingInfo: LegendInfo;

    labelsOpenState = false;
    stationSizeOpenState = false;
    coloursAndShapesOpenState = false;

    constructor() { }

    ngOnInit() { }

}
