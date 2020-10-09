import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { Color, LegendInfo, NodeShapeType } from '@app/tracing/data.model';

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

    @Input() set highlightingInfo(highlightingInfo: LegendInfo) {
        if (this._highlightingInfo !== highlightingInfo) {
            this.updateStationHighlighting(highlightingInfo);
            this._highlightingInfo = highlightingInfo;
        }
    }

    stationHighlightings: StationHighlightingEntry[] = [];
    private _highlightingInfo: LegendInfo;

    constructor() { }

    ngOnInit() { }

    private updateStationHighlighting(highlightingInfo: LegendInfo) {
        const newStationHighlightings: StationHighlightingEntry[] = [];
        if (highlightingInfo) {
            highlightingInfo.stations.forEach((stationLegendInfo, index) => {
                newStationHighlightings.push({
                    name: stationLegendInfo.label,
                    stationColor: stationLegendInfo.color,
                    shape: stationLegendInfo.shape
                });
            });
        }

        this.stationHighlightings = newStationHighlightings.map(e => ({
            name: e.name,
            stationColor: e.stationColor,
            shape: e.shape
        }));
    }
}
