import { FclData } from '../data.model';
import * as DataMapper from './data-mappings/data-mappings-v1';

enum ValueType {
    STRING = 'string' as any,
    BOOLEAN = 'boolean' as any,
    NUMBER = 'number' as any,
    INT = 'int' as any,
    DOUBLE = 'double' as any
}

interface ColumnProperty {
    id: string;
    type: string;
}

interface ItemProperty {
    id: string;
    value: string | number | boolean;
}
type DataRow = ItemProperty[];

interface DataTable {
    columnProperties: ColumnProperty[];
    data: DataRow[];
}

class PropCollector {
    private propList: ColumnProperty[] = [];
    private props: { [key: string]: ValueType } = {};
    constructor() {}

    push(id: string, type: ValueType) {
        if (!this.props[id]) {
            this.propList.push({ id: id, type: type.toString() });
            this.props[id] = type;
        }
    }
    getList(): ColumnProperty[] {
        return this.propList.slice();
    }
}

export function createFclElements(fclData: FclData): {
    stations: DataTable,
    deliveries: DataTable,
    deliveryRelations: DataTable
} {
    return {
        stations: createStationTable(fclData),
        deliveries: createDeliveryTable(fclData),
        deliveryRelations: createDeliveryRelationTable(fclData)
    };
}

function createStationTable(fclData: FclData): DataTable {
    const propMap = (
        fclData.source.propMaps && fclData.source.propMaps.stationPropMap ?
        fclData.source.propMaps.stationPropMap :
        DataMapper.DEFAULT_STATION_PROP_INT_TO_EXT_MAP.toObject()
    );
    return {
        columnProperties: collectStationProperties(fclData, propMap),
        data: fclData.fclElements.stations.map(station => {
            const dataRow: DataRow = [];
            dataRow.push({ id: propMap['id'], value: station.id });
            if (station.name !== undefined) {
                dataRow.push({ id: propMap['name'], value: station.name });
            }
            if (station.lat !== undefined) {
                dataRow.push({ id: propMap['lat'], value: station.lat });
            }
            if (station.lon !== undefined) {
                dataRow.push({ id: propMap['lon'], value: station.lon });
            }
            station.properties.forEach(prop => {
                dataRow.push({ id: propMap[prop.name] || prop.name, value: prop.value });
            });
            return dataRow;
        })
    };
}

function createDeliveryTable(fclData: FclData): DataTable {
    const propMap = (
        fclData.source.propMaps && fclData.source.propMaps.deliveryPropMap ?
        fclData.source.propMaps.deliveryPropMap :
        DataMapper.DEFAULT_DELIVERY_PROP_INT_TO_EXT_MAP.toObject()
    );
    return {
        columnProperties: collectDeliveryProperties(fclData, propMap),
        data: fclData.fclElements.deliveries.map(delivery => {
            const dataRow: DataRow = [];
            dataRow.push({ id: propMap['id'], value: delivery.id });
            dataRow.push({ id: propMap['source'], value: delivery.source });
            dataRow.push({ id: propMap['target'], value: delivery.target });
            if (delivery.name !== undefined) {
                dataRow.push({ id: propMap['name'], value: delivery.name });
            }
            if (delivery.lot !== undefined) {
                dataRow.push({ id: propMap['lot'], value: delivery.lot });
            }
            delivery.properties.forEach(prop => {
                dataRow.push({ id: propMap[prop.name] || prop.name, value: prop.value });
            });
            return dataRow;
        })
    };
}

function createDeliveryRelationTable(fclData: FclData): DataTable {
    const columnSourceId = DataMapper.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO.get('source').columnId;
    const columnTargetId = DataMapper.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO.get('target').columnId;
    return {
        columnProperties: [
            { id: columnSourceId, type: ValueType.STRING.toString() },
            { id: columnTargetId, type: ValueType.STRING.toString() }
        ],
        data: [].concat(...(fclData.fclElements.stations.map(
            station => station.connections.map(
                con => [
                        { id: columnSourceId, value: con.source },
                        { id: columnTargetId, value: con.target }
                ]
            )
        )))
    };
}

function collectDeliveryProperties(fclData: FclData, propMap: { [key: string]: string }): ColumnProperty[] {
    const propCollector = new PropCollector();
    propCollector.push(propMap['id'], ValueType.STRING);
    propCollector.push(propMap['source'], ValueType.STRING);
    propCollector.push(propMap['target'], ValueType.STRING);
    if (fclData.fclElements.deliveries.some(d => d.name !== undefined)) {
        propCollector.push(propMap['name'], ValueType.STRING);
    }
    if (fclData.fclElements.deliveries.some(d => d.lot !== undefined)) {
        propCollector.push(propMap['lot'], ValueType.STRING);
    }
    fclData.fclElements.deliveries.forEach(
        delivery => delivery.properties.forEach(
            stringProp => propCollector.push(propMap[stringProp.name] || stringProp.name, ValueType.STRING)
        )
    );

    return propCollector.getList();
}

function collectStationProperties(fclData: FclData, propMap: { [key: string]: string }): ColumnProperty[] {
    const propCollector = new PropCollector();

    propCollector.push(propMap['id'], ValueType.STRING);
    if (fclData.fclElements.stations.some(s => s.name !== undefined)) {
        propCollector.push(propMap['name'], ValueType.STRING);
    }
    if (fclData.fclElements.stations.some(s => s.lat !== undefined)) {
        propCollector.push(propMap['lat'], ValueType.DOUBLE);
    }
    if (fclData.fclElements.stations.some(s => s.lon !== undefined)) {
        propCollector.push(propMap['lon'], ValueType.DOUBLE);
    }
    fclData.fclElements.stations.forEach(
        station => station.properties.forEach(
            stringProp => propCollector.push(propMap[stringProp.name] || stringProp.name, ValueType.STRING)
        )
    );

    return propCollector.getList();
}
