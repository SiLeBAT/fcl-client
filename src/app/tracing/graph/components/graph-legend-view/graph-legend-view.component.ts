import { Component, Input } from '@angular/core';
import { LegendInfo, Color, NodeShapeType } from '@app/tracing/data.model';

interface LegendDisplayEntry {
    name: string;
    stationColor?: Color;
    deliveryColor?: Color;
    shape?: NodeShapeType;
}
interface LegendDisplayEntryWithIndex extends LegendDisplayEntry {
    index: number;
}

@Component({
    selector: 'fcl-graph-legend-view',
    templateUrl: './graph-legend-view.component.html',
    styleUrls: ['./graph-legend-view.component.scss']
})
export class GraphLegendViewComponent {

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


    private updateLegend(legendInfo: LegendInfo) {
        // Early Return if no legendinfo
        if (!legendInfo) { return; }

        this.legend = legendInfo.stations.map(
            (stationEntry): LegendDisplayEntryWithIndex =>
                ({
                    name: stationEntry.label,
                    index: stationEntry.index,
                    stationColor: stationEntry.color ?? undefined,
                    shape: stationEntry.shape ?? undefined,
                    deliveryColor: undefined
                })
        )
            .concat(
                legendInfo.deliveries
                    .map(
                        (deliveryEntry): LegendDisplayEntryWithIndex => ({
                            name: deliveryEntry.label,
                            index: deliveryEntry.index,
                            stationColor: undefined,
                            shape: undefined,
                            deliveryColor: deliveryEntry.color ?? undefined
                        })
                    )
            )
            //Should use toSorted once we update to a newer TS version.
            .sort(
                ((entryA, entryB) => entryA.index - entryB.index)
            )
            .reduce(
                (legend: LegendDisplayEntry[], currentEntry: LegendDisplayEntryWithIndex) => {
                    const index = legend.findIndex((entry) => entry.name === currentEntry.name);
                    if (index >= 0) {
                        //Should use legend.with(index,{newObj}) once we update to a newer TS version.
                        const newArray = legend;
                        newArray[index] = {
                            name: currentEntry.name,
                            stationColor: legend[index]?.stationColor ?? currentEntry?.stationColor,
                            deliveryColor: legend[index]?.deliveryColor ?? currentEntry?.deliveryColor,
                            shape: legend[index]?.shape ?? currentEntry?.shape
                        };
                        return newArray;
                    } else {
                        return [...legend,
                            {
                                name: currentEntry.name,
                                stationColor: legend[index]?.stationColor ?? currentEntry?.stationColor,
                                deliveryColor: legend[index]?.deliveryColor ?? currentEntry?.deliveryColor,
                                shape: legend[index]?.shape ?? currentEntry?.shape
                            }
                        ];
                    }
                },
                []
            );

        this.showStationColumn_ = this.legend.some(e => !!e.shape || !!e.stationColor);
        this.showDeliveryColumn_ = this.legend.some(e => !!e.deliveryColor);

    }

}
