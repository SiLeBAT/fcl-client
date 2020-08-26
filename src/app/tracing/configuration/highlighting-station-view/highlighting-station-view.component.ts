import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'fcl-highlighting-station-view',
    templateUrl: './highlighting-station-view.component.html',
    styleUrls: ['./highlighting-station-view.component.scss']
})
export class HighlightingStationViewComponent implements OnInit {
    labelsOpenState = false;
    stationSizeOpenState = false;
    coloursAndShapesOpenState = false;

    constructor() { }

    ngOnInit() {
    }

}
