import { Injectable } from '@angular/core';
import {
    DataServiceData,
    DeliveryData,
    StationData,
    TableColumn,
    TableRow,
    DataTable,
    NodeShapeType,
    DataServiceInputState,
    ColumnSubSets
} from '../data.model';
import * as _ from 'lodash';
import { DataService } from './data.service';
import { Constants } from '../util/constants';

const COLUMNS_ANO_FLAG: StatColumnsFlag = 'a';
const COLUMNS_HIGHLIGHTING_FLAG: StatColumnsFlag = 'h';

type StatColumnsFlag = 'h' | '' | 'a' | 'ah';
type DeliveryColumnsFlag = 'h' | '';

interface Cache {
    modelFlag: Record<string, never>;
    stationColumnSets: Partial<Record<StatColumnsFlag, ColumnSets>>;
    deliveryColumnSets: Partial<Record<DeliveryColumnsFlag, ColumnSets>>;
}

type ColumnSets = ColumnSubSets & Pick<DataTable, 'columns'>;

@Injectable({
    providedIn: 'root'
})
export class TableService {

    private cache: Cache = this.createEmptyCache();

    constructor(
        private dataService: DataService
    ) {}

    private checkCache(modelFlag: Record<string, never>): void {
        if (this.cache.modelFlag !== modelFlag) {
            this.cache = this.createEmptyCache(modelFlag);
        }
    }

    private createEmptyCache(modelFlag?: Record<string, never>): Cache {
        return {
            modelFlag: modelFlag || {},
            stationColumnSets: {},
            deliveryColumnSets: {}
        };
    }

    getDeliveryTable(state: DataServiceInputState, forHighlighting: boolean, deliveryIds?: string[]): DataTable {
        const data = this.dataService.getData(state);

        return {
            modelFlag: data.modelFlag,
            ...this.getDeliveryColumnSets(data, forHighlighting),
            rows: this.getDeliveryRows(data, forHighlighting, deliveryIds)
        };
    }

    getStationTable(state: DataServiceInputState, forHighlighting: boolean): DataTable {
        const data: DataServiceData = this.dataService.getData(state);

        return {
            modelFlag: data.modelFlag,
            ...this.getStationColumnSets(data, forHighlighting),
            rows: this.getStationRows(data, forHighlighting)
        };
    }

    private getFavouriteStationColumns(data: DataServiceData, forHighlighting: boolean): TableColumn[] {
        let colDefs = Constants.FAVOURITE_STAT_COLUMNS.toArray();
        if (forHighlighting) {
            colDefs = colDefs.filter(c => c.availableForHighlighting !== false);
        }
        const favColumns = colDefs.map(c => ({ id: c.id, name: c.name })) as TableColumn[];

        if (!forHighlighting && !data.isStationAnonymizationActive) {
            favColumns.find(c => c.id === Constants.COLUMN_ANONYMIZED_NAME).unavailable = true;
        }

        return favColumns;
    }

    private getFavouriteDeliveryColumns(forHighlighting: boolean): TableColumn[] {
        const favouriteColumns: TableColumn[] = [
            { id: 'id', name: 'ID' },
            { id: 'name', name: 'Product' },
            { id: 'lot', name: 'Lot' },
            { id: 'amount', name: 'Amount' },
            { id: 'dateOut', name: 'Delivery Date' },
            { id: 'dateIn', name: 'Delivery Date Arrival' },
            { id: 'outbreak', name: 'Outbreak' }
        ];
        if (!forHighlighting) {
            favouriteColumns.push(
                { id: 'source.name', name: 'Source' },
                { id: 'target.name', name: 'Target' }
            );
        }
        return favouriteColumns;
    }

    private getOtherDeliveryColumns(data: DataServiceData, forHighlighting: boolean, favouriteColumns: TableColumn[]): TableColumn[] {
        const otherColumns: TableColumn[] = [
            { id: 'source', name: 'Source ID' },
            { id: 'target', name: 'Target ID' },
            { id: 'weight', name: 'Weight' },
            { id: 'crossContamination', name: 'Cross Contamination' },
            { id: 'killContamination', name: 'Kill Contamination' },
            { id: 'observed', name: 'Observed' },
            { id: 'forward', name: 'On Forward Trace' },
            { id: 'backward', name: 'On Backward Trace' },
            { id: 'score', name: 'Score' },
            forHighlighting ? null : { id: 'selected', name: 'Selected' },
            forHighlighting ? null : { id: 'invisible', name: 'Invisible' }
        ].filter(c => c !== null);

        this.addColumnsForProperties(otherColumns, data.deliveries);
        return this.getCleanedAndSortedOtherColumns(otherColumns, favouriteColumns);
    }

    getDeliveryColumnSets(data: DataServiceData, forHighlighting: boolean): ColumnSets {
        this.checkCache(data.modelFlag);

        const cacheFlag = forHighlighting ? 'h' : '';
        let columnSets = this.cache.deliveryColumnSets[cacheFlag];

        if (!columnSets) {
            const favouriteColumns = this.getFavouriteDeliveryColumns(forHighlighting);
            const otherColumns = this.getOtherDeliveryColumns(data, forHighlighting, favouriteColumns);
            columnSets = {
                columns: [].concat(favouriteColumns, otherColumns),
                favouriteColumns: favouriteColumns,
                otherColumns: otherColumns
            };
            this.cache.deliveryColumnSets[cacheFlag] = columnSets;
        }
        return columnSets;
    }

    private getOtherStationColumns(data: DataServiceData, forHighlighting: boolean, favouriteColumns: TableColumn[]): TableColumn[] {
        let colDefs = Constants.KNOWN_OTHER_STAT_COLUMNS.toArray();
        if (forHighlighting) {
            colDefs = colDefs.filter(c => c.availableForHighlighting !== false);
        }

        const otherColumns = colDefs.map(c => ({ id: c.id, name: c.name }));

        this.addColumnsForProperties(otherColumns, data.stations);
        return this.getCleanedAndSortedOtherColumns(otherColumns, favouriteColumns);
    }

    getStationColumnSets(data: DataServiceData, forHighlighting: boolean): ColumnSets {
        this.checkCache(data.modelFlag);

        const cacheFlag = (data.isStationAnonymizationActive ? 'a' : '') + (forHighlighting ? 'h' : '');
        let columnSets = this.cache.stationColumnSets[cacheFlag];

        if (!columnSets) {
            const favouriteColumns: TableColumn[] = this.getFavouriteStationColumns(data, forHighlighting);
            const otherColumns = this.getOtherStationColumns(data, forHighlighting, favouriteColumns);
            columnSets = {
                columns: [].concat(favouriteColumns, otherColumns),
                favouriteColumns: favouriteColumns,
                otherColumns: otherColumns
            };
            this.cache.stationColumnSets[cacheFlag] = columnSets;
        }
        return columnSets;
    }

    private sortColumns(columns: TableColumn[]): TableColumn[] {
        return _.sortBy(columns, [(column: TableColumn) => column.name.toLowerCase()]);
    }

    private getCleanedAndSortedOtherColumns(otherColumns: TableColumn[], favouriteColumns: TableColumn[]): TableColumn[] {
        return this.sortColumns(
            otherColumns.filter(ac => !favouriteColumns.some(fc => fc.id === ac.id))
        );
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

    private getDeliveryRows(data: DataServiceData, forHighlighting: boolean, deliveryIds?: string[]): TableRow[] {
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
                target: delivery.target,
                dateOut: delivery.dateOut,
                dateIn: delivery.dateIn,
                weight: delivery.weight,
                killContamination: delivery.killContamination,
                crossContamination: delivery.crossContamination,
                observed: delivery.observed,
                forward: delivery.forward,
                backward: delivery.backward,
                score: delivery.score
            };

            if (!forHighlighting) {
                row['source.name'] = data.statMap[delivery.source].name;
                row['target.name'] = data.statMap[delivery.target].name;
                row['selected'] = delivery.selected;
                row['invisible'] = delivery.invisible;
            }

            delivery.properties.forEach(
                prop => row[prop.name] = prop.value
            );

            return row;
        });
    }

    private getStationRows(data: DataServiceData, forHighlighting: boolean): TableRow[] {
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
                lat: station.lat,
                lon: station.lon,
                highlightingInfo: station.highlightingInfo
            };

            if (!forHighlighting) {
                row['selected'] = station.selected;
                row['invisible'] = station.invisible;
                if (data.isStationAnonymizationActive) {
                    row['anonymizedName'] = station.anonymizedName;
                }
            }

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
            .replace(/^([a-z]+)/g, (match: string, p1: string) => p1.charAt(0).toUpperCase() + p1.slice(1))
            .replace(/(^\_chargen\.)(.*)/gi, 'Lot ' + '$2'.trim().charAt(0).toUpperCase() + '$2'.slice(1))
            .replace(/(^\_lieferungen\.)(.*)/gi, (match: string, p1: string, p2: string) =>
                'Delivery ' + p2.charAt(0).toUpperCase() + p2.slice(1))
            .replace(/lot id/gi, 'Lot ID');

    }

    private collectProps(arr: (StationData | DeliveryData)[]): { id: string; type: string }[] {
        const result: { id: string; type: string }[] = [];
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
