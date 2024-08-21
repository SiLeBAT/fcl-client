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
    ColumnSets
} from '../data.model';
import * as _ from 'lodash';
import { DataService } from './data.service';
import { Constants } from '../util/constants';
import { concat, entries, values } from '../util/non-ui-utils';

const COLUMNS_ANO_FLAG: StatColumnsFlag = 'a';
const COLUMNS_HIGHLIGHTING_FLAG: StatColumnsFlag = 'h';

type StatColumnsFlag = 'h' | '' | 'a' | 'ah';
type DeliveryColumnsFlag = 'h' | '';

function isNullish(x: unknown): boolean {
    return x === undefined || x === null;
}

interface Cache {
    modelFlag: Record<string, never>;
    stationColumnSets: Partial<Record<StatColumnsFlag, ColumnSets>>;
    deliveryColumnSets: Partial<Record<DeliveryColumnsFlag, ColumnSets>>;
    availableStatProps: Set<string>;
    availableDeliveryProps: Set<string>;
}

@Injectable({
    providedIn: 'root'
})
export class TableService {

    private cache: Cache = this.createEmptyCache();

    constructor(
        private dataService: DataService
    ) { }

    private checkCache(data: DataServiceData): void {
        if (this.cache.modelFlag !== data.modelFlag) {
            this.cache = this.createEmptyCache(data.modelFlag);
            this.cache.availableStatProps = this.getAvailableStationProps(data);
            this.cache.availableDeliveryProps = this.getAvailableDeliveryProps(data);
        } else {
            this.updateColsDataAvailability(data);
        }
    }

    private createEmptyCache(modelFlag?: Record<string, never>): Cache {
        return {
            modelFlag: modelFlag || {},
            stationColumnSets: {},
            deliveryColumnSets: {},
            availableStatProps: new Set(),
            availableDeliveryProps: new Set()
        };
    }

    private getAvailableProps<T extends StationData | DeliveryData>(
        elements: T[], requiredProps: (keyof T)[], optProps: (keyof T)[]
    ): Set<string> {
        const availablePropsSet = new Set<string>();
        if (elements.length >= 1) {
            requiredProps.forEach(p => availablePropsSet.add(p as string));

            const availableProps = optProps.filter(p => elements.some(e => !isNullish(e[p])));
            availableProps.forEach(p => availablePropsSet.add(p as string));
            for (const element of elements) {
                element.properties.forEach(pe => availablePropsSet.add(pe.name));
            }
        }
        return availablePropsSet;
    }

    private getAvailableStationProps(data: DataServiceData): Set<string> {
        return this.getAvailableProps(
            data.stations,
            [
                'id', 'score', 'outbreak', 'weight', 'crossContamination', 'killContamination', 'forward', 'backward', 'commonLink',
                'observed', 'contained', 'invisible', 'isMeta', 'selected'
            ],
            ['name', 'anonymizedName', 'lat', 'lon']
        );
    }

    private getAvailableDeliveryProps(data: DataServiceData): Set<string> {
        const availableProps = this.getAvailableProps(
            data.deliveries,
            [
                'id', 'score', 'outbreak', 'weight', 'crossContamination', 'killContamination', 'forward', 'backward',
                'observed', 'invisible', 'selected', 'dateIn', 'dateOut',
                'originalSource', 'originalTarget', 'source', 'target'
            ],
            ['name', 'lot']
        );
        if (data.deliveries.some(d => !isNullish(data.statMap[d.source].name))) {
            availableProps.add('source.name');
        }
        if (data.deliveries.some(d => !isNullish(data.statMap[d.target].name))) {
            availableProps.add('target.name');
        }
        return availableProps;
    }

    private updateDelColsDataAvailability(data: DataServiceData): void {
        const prevAvailableProps = new Set(this.cache.availableDeliveryProps);
        const props2Check: [keyof DeliveryData, keyof StationData, string][] = [
            ['source', 'name', 'source.name'],
            ['target', 'name', 'target.name']
        ];
        props2Check.forEach(([dKey, sKey, p]) => {
            const isDataAvailable = data.deliveries.some(d => !isNullish(data.statMap[d[dKey] as string][sKey]));
            const isCacheUpdateRequired = isDataAvailable !== this.cache.availableDeliveryProps.has(p);
            if (isCacheUpdateRequired) {
                if (isDataAvailable) {
                    this.cache.availableDeliveryProps.add(p);
                } else {
                    this.cache.availableDeliveryProps.delete(p);
                }
            }
        });
        this.setColumnSetsDataAvailability(this.cache.deliveryColumnSets, this.cache.availableDeliveryProps, prevAvailableProps);
    }

    private setColumnSetsDataAvailability<T extends string>(
        flag2ColSets: Partial<Record<T, ColumnSets>>, availableProps: Set<string>, prevAvailableProps: Set<string>
    ): void {
        const propsWithChangedAvailabilities = new Set(concat(
            Array.from(prevAvailableProps).filter(p => !availableProps.has(p)),
            Array.from(availableProps).filter(p => !prevAvailableProps.has(p))
        ));

        if (propsWithChangedAvailabilities.size > 0) {
            for (const columnSets of values(flag2ColSets)) {
                for (const [subSetKey, cols] of entries(columnSets)) {
                    if (cols.some(c => propsWithChangedAvailabilities.has(c.id))) {
                        this.setColumnDataAvailibility(cols, availableProps);
                        columnSets[subSetKey] = cols.slice();
                    }
                }
            }
        }
    }

    private updateStatColsDataAvailability(data: DataServiceData): void {
        const prevAvailableStatProps = new Set(this.cache.availableStatProps);
        const props2Check: (keyof StationData)[] = ['name', 'anonymizedName'];
        props2Check.forEach(p => {
            const isDataAvailable = data.stations.some(s => !isNullish(s[p]));
            const isCacheUpdateRequired = isDataAvailable !== this.cache.availableStatProps.has(p);
            if (isCacheUpdateRequired) {
                if (isDataAvailable) {
                    this.cache.availableStatProps.add(p);
                } else {
                    this.cache.availableStatProps.delete(p);
                }
            }
        });

        this.setColumnSetsDataAvailability(this.cache.stationColumnSets, this.cache.availableStatProps, prevAvailableStatProps);
    }

    private updateColsDataAvailability(data: DataServiceData): void {
        this.updateStatColsDataAvailability(data);
        this.updateDelColsDataAvailability(data);
    }

    private setColumnDataAvailibility(columns: TableColumn[], availablePropsSet: Set<string>): void {
        columns.forEach(c => c.dataIsUnavailable = !availablePropsSet.has(c.id));
    }

    getDeliveryTable(state: DataServiceInputState, forHighlighting: boolean, deliveryIds?: string[]): DataTable {
        const data = this.dataService.getData(state);
        
        return {
            modelFlag: data.modelFlag,
            ...this.getDeliveryColumnSets(state, data, forHighlighting),
            rows: this.getDeliveryRows(data, forHighlighting, deliveryIds)
        };
    }

    getStationTable(state: DataServiceInputState, forHighlighting: boolean): DataTable {
        const data: DataServiceData = this.dataService.getData(state);

        return {
            modelFlag: data.modelFlag,
            ...this.getStationColumnSets(state, data, forHighlighting),
            rows: this.getStationRows(data, forHighlighting)
        };
    }

    private getFavouriteStationColumns(data: DataServiceData, forHighlighting: boolean): TableColumn[] {
        let colDefs = Constants.FAVOURITE_STAT_COLUMNS.toArray();
        if (forHighlighting) {
            colDefs = colDefs.filter(c => c.availableForHighlighting !== false);
        }
        const favColumns = colDefs.map(c => ({ id: c.id, name: c.name })) as TableColumn[];

        this.setColumnDataAvailibility(favColumns, this.cache.availableStatProps);

        return favColumns;
    }

    private getFavouriteDeliveryColumns(forHighlighting: boolean): TableColumn[] {
        const favColumns: TableColumn[] = [
            { id: 'id', name: 'ID' },
            { id: 'name', name: 'Product' },
            { id: 'lot', name: 'Lot' },
            { id: 'amount', name: 'Amount' },
            { id: 'dateOut', name: 'Delivery Date' },
            { id: 'dateIn', name: 'Delivery Date Arrival' },
            { id: 'outbreak', name: 'Outbreak' }
        ];
        if (!forHighlighting) {
            favColumns.push(
                { id: 'source.name', name: 'Source' },
                { id: 'target.name', name: 'Target' }
            );
        }

        this.setColumnDataAvailibility(favColumns, this.cache.availableDeliveryProps);

        return favColumns;
    }

    private getOtherDeliveryColumns(
        state: DataServiceInputState,
        data: DataServiceData,
        forHighlighting: boolean,
        favouriteColumns: TableColumn[]
    ): TableColumn[] {
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
            ...(forHighlighting ? [] : [
                { id: 'selected', name: 'Selected' },
                { id: 'invisible', name: 'Invisible' }
            ])
        ];

        this.addColumnsForProperties(otherColumns, data.deliveries);
        this.addColumnsForOtherMappings(otherColumns, state.int2ExtPropMaps.deliveries, new Set(Constants.DELIVERY_PROPERTIES.toArray()));

        const cleanedOtherColumns = this.getCleanedAndSortedOtherColumns(otherColumns, favouriteColumns);

        this.setColumnDataAvailibility(cleanedOtherColumns, this.cache.availableDeliveryProps);

        return cleanedOtherColumns;
    }

    getDeliveryColumnSets(state: DataServiceInputState, data: DataServiceData, forHighlighting: boolean): ColumnSets {
        this.checkCache(data);

        const cacheFlag = forHighlighting ? 'h' : '';
        let columnSets = this.cache.deliveryColumnSets[cacheFlag];

        if (!columnSets) {
            const favouriteColumns = this.getFavouriteDeliveryColumns(forHighlighting);
            const otherColumns = this.getOtherDeliveryColumns(state, data, forHighlighting, favouriteColumns);
            columnSets = {
                columns: concat(favouriteColumns, otherColumns),
                favouriteColumns: favouriteColumns,
                otherColumns: otherColumns
            };
            this.cache.deliveryColumnSets[cacheFlag] = columnSets;
        }
        return columnSets;
    }

    private getOtherStationColumns(
        state: DataServiceInputState,
        data: DataServiceData,
        forHighlighting: boolean,
        favouriteColumns: TableColumn[]
    ): TableColumn[] {
        let colDefs = Constants.KNOWN_OTHER_STAT_COLUMNS.toArray();
        if (forHighlighting) {
            colDefs = colDefs.filter(c => c.availableForHighlighting !== false);
        }

        const otherColumns = colDefs.map(c => ({ id: c.id, name: c.name }));

        this.addColumnsForProperties(otherColumns, data.stations);
        this.addColumnsForOtherMappings(otherColumns, state.int2ExtPropMaps.stations, new Set(Constants.STATION_PROPERTIES.toArray()));

        const cleanedOtherColumns = this.getCleanedAndSortedOtherColumns(otherColumns, favouriteColumns);

        this.setColumnDataAvailibility(cleanedOtherColumns, this.cache.availableStatProps);

        return cleanedOtherColumns;
    }

    getStationColumnSets(state: DataServiceInputState, data: DataServiceData, forHighlighting: boolean): ColumnSets {
        this.checkCache(data);

        const cacheFlag = (data.isStationAnonymizationActive ? 'a' : '') + (forHighlighting ? 'h' : '');
        let columnSets = this.cache.stationColumnSets[cacheFlag];

        if (!columnSets) {
            const favouriteColumns: TableColumn[] = this.getFavouriteStationColumns(data, forHighlighting);
            const otherColumns = this.getOtherStationColumns(state, data, forHighlighting, favouriteColumns);

            columnSets = {
                columns: concat(favouriteColumns, otherColumns),
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

    private addColumnsForOtherMappings(
        columns: TableColumn[],
        int2ExtPropMap: Record<string, string>,
        ignoreProps: Set<string>
    ): void {
        const mappedProps = Object.keys(int2ExtPropMap);
        mappedProps.forEach(prop => {
            if (!ignoreProps.has(prop) && !columns.some(c => c.id === prop)) {
                columns.push({
                    id: prop,
                    name: this.decamelize(int2ExtPropMap[prop])
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
                        delivery.highlightingInfo!.color.length > 0 ?
                            delivery.highlightingInfo!.color :
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
                score: delivery.score,
                outbreak: delivery.outbreak,
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
                highlightingInfo: station.highlightingInfo!
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
        const props: { [key: string]: string } = {};
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
