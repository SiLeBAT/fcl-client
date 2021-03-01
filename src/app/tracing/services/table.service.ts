import { Injectable } from '@angular/core';
import {
    BasicGraphState,
    DataServiceData,
    DeliveryData,
    StationData,
    TableColumn,
    TableRow,
    StationTable,
    DataTable,
    NodeShapeType
} from '../data.model';
import * as _ from 'lodash';
import { DataService } from './data.service';

export interface ColumnOption {
    value: string;
    viewValue: string;
    selected: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class TableService {

    constructor(private dataService: DataService) {}

    getDeliveryData(state: BasicGraphState, deliveryIds?: string[]): DataTable {
        const data = this.dataService.getData(state);
        return {
            columns: this.getDeliveryColumns(data),
            rows: this.getDeliveryRows(data, deliveryIds)
        };
    }

    getStationData(state: BasicGraphState): StationTable {
        const data: DataServiceData = this.dataService.getData(state);
        return {
            columns: this.getStationColumns(data),
            rows: this.getStationRows(data)
        };
    }

    getDeliveryColumns(data: DataServiceData): TableColumn[] {
        const columns: TableColumn[] = [
            { id: 'id', name: 'ID' },
            { id: 'source', name: 'Source ID' },
            { id: 'source.name', name: 'Source' },
            { id: 'target', name: 'Target ID' },
            { id: 'target.name', name: 'Target' },
            { id: 'name', name: 'Product' },
            { id: 'lot', name: 'Lot' },
            { id: 'dateOut', name: 'Delivery Date' },
            { id: 'dateIn', name: 'Delivery Date Arrival' },
            { id: 'weight', name: 'Weight' },
            { id: 'crossContamination', name: 'Cross Contamination' },
            { id: 'killContamination', name: 'Kill Contamination' },
            { id: 'observed', name: 'Observed' },
            { id: 'forward', name: 'Forward' },
            { id: 'backward', name: 'Backward' },
            { id: 'score', name: 'Score' },
            { id: 'selected', name: 'Selected' }
        ];

        this.addColumnsForProperties(columns, data.deliveries);

        return columns;
    }

    getStationColumns(data: DataServiceData): TableColumn [] {

        const columns: TableColumn[] = [
            { id: 'id', name: 'ID' },
            { id: 'name', name: 'Name' },
            { id: 'score', name: 'Score' },
            { id: 'outbreak', name: 'Outbreak' },
            { id: 'weight', name: 'Weight' },
            { id: 'forward', name: 'Forward' },
            { id: 'backward', name: 'Backward' },
            { id: 'crossContamination', name: 'Cross Contamination' },
            { id: 'killContamination', name: 'Kill Contamination' },
            { id: 'observed', name: 'Observed' },
            { id: 'commonLink', name: 'Common Link' },
            { id: 'selected', name: 'Selected' },
            { id: 'invisible', name: 'Invisible' },
            { id: 'country', name: 'Country' },
            { id: 'typeOfBusiness', name: 'Type of Business' },
            { id: 'lat', name: 'Latitude' },
            { id: 'lon', name: 'Longitude' },
            { id: 'isMeta', name: 'Is Meta Station' },
            { id: 'contained', name: 'Is Meta Member' }
        ];

        this.addColumnsForProperties(columns, data.stations);

        return columns;
    }

    private addColumnsForProperties(columns: TableColumn[], arr: (StationData | DeliveryData)[]): void {
        const props = this.collectProps(arr);
        props.forEach(prop => {
            if (!columns.some(c => c.id === prop.id)) {
                columns.push({
                    id: prop.id,
                    name: this.decamelize(prop.id)
                });
            }
        });
    }

    private getDeliveryRows(data: DataServiceData, deliveryIds?: string[]): TableRow[] {
        return (
            deliveryIds ?
            data.getDelById(deliveryIds) :
            data.deliveries
        ).map(delivery => {
            const row: TableRow = {
                id: delivery.id,
                highlightingInfo: {
                    color: (
                        delivery.highlightingInfo.color.length > 0 ?
                        delivery.highlightingInfo.color :
                        [[0, 0, 0]]
                    ),
                    shape: NodeShapeType.SQUARE
                },
                name: delivery.name,
                lot: delivery.lot,
                source: delivery.source,
                'source.name': data.statMap[delivery.source].name,
                target: delivery.target,
                'target.name': data.statMap[delivery.target].name,
                dateOut: delivery.dateOut,
                dateIn: delivery.dateIn,
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
                prop => row[prop.name] = prop.value
            );

            return row;
        });
    }

    private getStationRows(data: DataServiceData): TableRow[] {
        const rows = data.stations.map(station => {
            const row: TableRow = {
                id: station.id,
                name: station.name,
                score: station.score,
                isMeta: station.isMeta,
                contained: station.contained,
                outbreak: station.outbreak,
                weight: station.weight,
                forward: station.forward,
                backward: station.backward,
                crossContamination: station.crossContamination,
                killContamination: station.killContamination,
                observed: station.observed,
                commonLink: station.commonLink,
                selected: station.selected,
                invisible: station.invisible,
                lat: station.lat,
                lon: station.lon,
                highlightingInfo: station.highlightingInfo
            };

            station.properties.forEach(
                prop => row[prop.name] = prop.value
            );

            return row;
        });

        this.assignParentsToStationRows(rows, data);

        return rows;
    }

    private assignParentsToStationRows(rows: TableRow[], data: DataServiceData): void {
        const idToRowMap: Record<string, TableRow> = {};
        data.stations.forEach((station, index) => {
            if (station.contained) {
                idToRowMap[station.id] = rows[index];
            } else if (station.contains.length > 0) {
                const row = rows[index];
                for (const memberId of station.contains) {
                    const memberRow = idToRowMap[memberId];
                    memberRow.parentRow = row;
                    memberRow.parentRowId = row.id;
                }
            }
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
