import { Injectable } from '@angular/core';
import {
    BasicGraphState, DataServiceData, DeliveryData, StationData, Color
} from '../data.model';
import * as _ from 'lodash';
import { DataService } from './data.service';

interface TableColumn {
    id: string;
    name: string;
}

interface TableRow<H> {
    id: string;
    highlightingInfo: H;
    [key: string]: string | number | boolean | H;
}

interface DeliveryHighlightingInfo {
    color: number[][];
}

interface DeliveryTableRow extends TableRow<DeliveryHighlightingInfo> {}

interface DeliveryTable {
    columns: TableColumn[];
    rows: DeliveryTableRow[];
}

@Injectable({
    providedIn: 'root'
})
export class TableService {

    constructor(private dataService: DataService) {}

    getDeliveryData(state: BasicGraphState, deliveryIds: string[]): DeliveryTable {
        const data = this.dataService.getData(state);
        return {
            columns: this.getDeliveryColumns(data),
            rows: this.getDeliveryRows(data, deliveryIds)
        };
    }

    private getDeliveryColumns(data: DataServiceData): TableColumn[] {
        const d: DeliveryData = null;
        const columns: TableColumn[] = [
            { id: 'id', name: 'ID' },
            { id: 'source', name: 'Source ID' },
            { id: 'source.name', name: 'Source Name' },
            { id: 'target', name: 'Target ID' },
            { id: 'target.name', name: 'Target Name' },
            { id: 'name', name: 'Product' },
            { id: 'lot', name: 'Lot' },
            { id: 'weight', name: 'Weight' },
            { id: 'crossContamination', name: 'Cross Contamination' },
            { id: 'killContamination', name: 'Kill Contamination' },
            { id: 'observed', name: 'Observed' },
            { id: 'forward', name: 'Forward' },
            { id: 'backward', name: 'Backward' },
            { id: 'score', name: 'Score' },
            { id: 'selected', name: 'Selected' }
        ];
        const props = this.collectProps(data.deliveries);
        props.forEach(prop => {
            const name = this.decamelize(prop.id);
            const index = columns.findIndex(c => c.name === prop.id);
            columns.push({
                id: 'ext' + prop.id,
                name: index >= 0 ? `${name} (ext)` : name
            });
        });
        return columns;
    }

    private getDeliveryRows(data: DataServiceData, deliveryIds: string[]): DeliveryTableRow[] {
        return data.getDelById(deliveryIds).map(delivery => {
            const row: DeliveryTableRow = {
                id: delivery.id,
                highlightingInfo: { color: delivery.highlightingInfo.color },
                name: delivery.name,
                lot: delivery.lot,
                source: delivery.source,
                'source.name': data.statMap[delivery.source].name,
                target: delivery.target,
                'target.name': data.statMap[delivery.target].name,
                date: delivery.date,
                weight: delivery.weight,
                killContamination: delivery.killContamination,
                crossContamination: delivery.crossContamination,
                observed: delivery.observed,
                forward: delivery.forward,
                backward: delivery.backward,
                score: delivery.score,
                selected: delivery.selected
            };

            delivery.properties.forEach(
                prop => row['ext' + prop.name] = prop.value
            );

            return row;
        });
    }

    private decamelize(str: string): string {
        const separator = ' ';

        return str
            .replace(/([a-z\d])([A-Z])/g, '$1' + separator + '$2')
            .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1' + separator + '$2')
            .toLowerCase();
    }

    private collectProps(arr: (StationData | DeliveryData)[]): { id: string, type: string }[] {
        const result: { id: string, type: string }[] = [];
        const props: { [key: string ]: string } = {};
        arr.forEach(item => item.properties.filter(
            prop => prop.value !== undefined || prop.value !== null
        ).forEach(
            prop => {
                if (props[prop.name] === undefined) {
                    const type = typeof prop.value;
                    props[prop.name] = type;
                    result.push({
                        id: prop.name,
                        type: type
                    });
                }
            }
        ));
        return result;
    }
}
