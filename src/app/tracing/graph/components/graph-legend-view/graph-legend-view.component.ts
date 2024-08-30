import { Component, Input } from '@angular/core';
import { LegendDisplayEntry } from '@app/tracing/data.model';

@Component({
    selector: 'fcl-graph-legend-view',
    templateUrl: './graph-legend-view.component.html',
    styleUrls: ['./graph-legend-view.component.scss']
})
export class GraphLegendViewComponent {

    private legendInfo_: LegendDisplayEntry[] | null = null;
    private showStationColumn_ = false;
    private showDeliveryColumn_ = false;

    @Input() showMissingGisInfoEntry: boolean;

    @Input() set legendInfo(legendInfo: LegendDisplayEntry[]) {
        if (this.legendInfo_ !== legendInfo) {
            this.updateLegend(legendInfo);
            this.legendInfo_ = legendInfo;
        }
    }

    legend: LegendDisplayEntry[] = [];

    get showStationColumn(): boolean {
        return this.showStationColumn_;
    }

    get showDeliveryColumn(): boolean {
        return this.showDeliveryColumn_;
    }

    isEmpty(): boolean {
        return this.legend.length === 0;
    }


    private updateLegend(legend: LegendDisplayEntry[]) {
        this.legend = legend;
        this.showStationColumn_ = this.legend.some(e => !!e.shape || !!e.stationColor);
        this.showDeliveryColumn_ = this.legend.some(e => !!e.deliveryColor);
    }

}
