import { Component, OnInit, Input } from '@angular/core';
import { Utils } from '../../../util/non-ui-utils';
import { LegendInfo, Color, NodeShapeType } from '@app/tracing/data.model';

interface LegendEntry {
    name: string;
    stationColor?: Color;
    deliveryColor?: Color;
    shape?: NodeShapeType;
}
interface LegendEntryWithIndices extends LegendEntry {
    deliveryIndex?: number;
}

@Component({
    selector: 'fcl-graph-legend-view',
    templateUrl: './graph-legend-view.component.html',
    styleUrls: ['./graph-legend-view.component.scss']
})
export class GraphLegendViewComponent implements OnInit {

    private legendInfo_: LegendInfo | null = null;
    private showStationColumn_ = false;
    private showDeliveryColumn_ = false;

    @Input() showMissingGisInfoEntry: boolean;

    @Input() set legendInfo(legendInfo: LegendInfo) {
        if (this.legendInfo_ !== legendInfo) {
            this.updateLegend(legendInfo);
            this.legendInfo_ = legendInfo;
        }
    }

    legend: LegendEntry[] = [];

    get showStationColumn(): boolean {
        return this.showStationColumn_;
    }

    get showDeliveryColumn(): boolean {
        return this.showDeliveryColumn_;
    }

    isEmpty(): boolean {
        return this.legend.length === 0;
    }
    constructor() { }

    ngOnInit() {
    }

    private updateLegend(legendInfo: LegendInfo) {
        const newLegend: LegendEntryWithIndices[] = [];
        if (legendInfo) {
            legendInfo.stations.forEach((stationLegendInfo, index) => {
                newLegend.push({
                    name: stationLegendInfo.label,
                    stationColor: stationLegendInfo.color,
                    shape: stationLegendInfo.shape
                });
            });
            const entryMap = Utils.createObjectFromArray(newLegend, (e) => e.name);
            legendInfo.deliveries.forEach((deliveryLegendInfo, index) => {
                const entry = entryMap[deliveryLegendInfo.label];
                if (entry) {
                    entry.deliveryColor = deliveryLegendInfo.color;
                    entry.deliveryIndex = index;
                } else {
                    const newEntry: LegendEntryWithIndices = {
                        name: deliveryLegendInfo.label,
                        deliveryColor: deliveryLegendInfo.color,
                        deliveryIndex: index
                    };
                    const beforeIndex = newLegend.findIndex(e => e.deliveryIndex !== undefined && e.deliveryIndex > index);

                    if (beforeIndex >= 0) {
                        newLegend.splice(beforeIndex, 0, newEntry);
                    } else {
                        newLegend.push(newEntry);
                    }
                }
            });
        }

        this.legend = newLegend.map(e => ({
            name: e.name,
            stationColor: e.stationColor,
            deliveryColor: e.deliveryColor,
            shape: e.shape
        }));
        this.showStationColumn_ = this.legend.some(e => !!e.shape || !!e.stationColor);
        this.showDeliveryColumn_ = this.legend.some(e => !!e.deliveryColor);
    }

}
