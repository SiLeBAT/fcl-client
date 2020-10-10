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

    private createTestLegendInfo(): LegendInfo {
        return {
            stations: [
                {
                    label: 'TestEntry C',
                    color: { r: 200, g: 200, b: 0 },
                    shape: NodeShapeType.CIRCLE
                },
                {
                    label: 'TestEntry Sq',
                    color: { r: 100, g: 0, b: 100 },
                    shape: NodeShapeType.SQUARE
                },
                {
                    label: 'TestEntry Dia',
                    color: { r: 200, g: 0, b: 100 },
                    shape: NodeShapeType.DIAMOND
                },
                {
                    label: 'TestEntry Pen',
                    color: { r: 200, g: 100, b: 0 },
                    shape: NodeShapeType.PENTAGON
                },
                {
                    label: 'TestEntry Hex',
                    color: { r: 200, g: 0, b: 100 },
                    shape: NodeShapeType.HEXAGON
                },
                {
                    label: 'TestEntry OCT',
                    color: { r: 200, g: 100, b: 0 },
                    shape: NodeShapeType.OCTAGON
                },
                {
                    label: 'TestEntry Star',
                    color: { r: 200, g: 50, b: 50 },
                    shape: NodeShapeType.STAR
                },
                {
                    label: 'TestEntry NoShape',
                    color: { r: 50, g: 100, b: 200 },
                    shape: null
                },
                {
                    label: 'TestEntry Shared',
                    color: { r: 50, g: 200, b: 200 },
                    shape: null
                }
            ],
            deliveries: [
                {
                    label: 'TestEntry Shared',
                    color: { r: 100, g: 220, b: 50 },
                    linePattern: null
                },
                {
                    label: 'TestEntry DelOnly',
                    color: { r: 20, g: 220, b: 50 },
                    linePattern: null
                }
            ]
        };
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
