import { FclData } from '../data.model';
import { Constants } from './data-mappings/data-mappings-v1';

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
    return {
        columnProperties: collectStationProperties(fclData),
        data: fclData.fclElements.stations.map(station => {
            const dataRow: DataRow = [];
            dataRow.push({ id: Constants.STATION_PROP_INT_TO_EXT_MAP.get('id').columnId, value: station.id });
            if (station.name !== undefined) {
                dataRow.push({ id: Constants.STATION_PROP_INT_TO_EXT_MAP.get('name').columnId, value: station.name });
            }
            if (station.lat !== undefined) {
                dataRow.push({ id: Constants.STATION_PROP_INT_TO_EXT_MAP.get('lat').columnId, value: station.lat });
            }
            if (station.lon !== undefined) {
                dataRow.push({ id: Constants.STATION_PROP_INT_TO_EXT_MAP.get('lon').columnId, value: station.lon });
            }
            station.properties.forEach(prop => {
                dataRow.push({ id: prop.name, value: prop.value });
            });
            return dataRow;
        })
    };
}

function createDeliveryTable(fclData: FclData): DataTable {
    return {
        columnProperties: collectDeliveryProperties(fclData),
        data: fclData.fclElements.deliveries.map(delivery => {
            const dataRow: DataRow = [];
            dataRow.push({ id: Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('id').columnId, value: delivery.id });
            dataRow.push({ id: Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('source').columnId, value: delivery.source });
            dataRow.push({ id: Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('target').columnId, value: delivery.target });
            if (delivery.name !== undefined) {
                dataRow.push({ id: Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('name').columnId, value: delivery.name });
            }
            if (delivery.lot !== undefined) {
                dataRow.push({ id: Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('lot').columnId, value: delivery.lot });
            }
            delivery.properties.forEach(prop => {
                dataRow.push({ id: prop.name, value: prop.value });
            });
            return dataRow;
        })
    };
}

function createDeliveryRelationTable(fclData: FclData): DataTable {
    const columnSourceId = Constants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO.get('source').columnId;
    const columnTargetId = Constants.DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO.get('target').columnId;
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

function collectDeliveryProperties(fclData: FclData): ColumnProperty[] {
    const propCollector = new PropCollector();
    propCollector.push(Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('id').columnId, ValueType.STRING);
    propCollector.push(Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('source').columnId, ValueType.STRING);
    propCollector.push(Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('target').columnId, ValueType.STRING);
    if (fclData.fclElements.deliveries.some(d => d.name !== undefined)) {
        propCollector.push(Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('name').columnId, ValueType.STRING);
    }
    if (fclData.fclElements.deliveries.some(d => d.lot !== undefined)) {
        propCollector.push(Constants.DELIVERY_PROP_INT_TO_EXT_MAP.get('lot').columnId, ValueType.STRING);
    }
    fclData.fclElements.deliveries.forEach(
        delivery => delivery.properties.forEach(stringProp => propCollector.push(stringProp.name, ValueType.STRING))
    );

    return propCollector.getList();
}

function collectStationProperties(fclData: FclData): ColumnProperty[] {
    const propCollector = new PropCollector();

    propCollector.push(Constants.STATION_PROP_INT_TO_EXT_MAP.get('id').columnId, ValueType.STRING);
    if (fclData.fclElements.stations.some(s => s.name !== undefined)) {
        propCollector.push(Constants.STATION_PROP_INT_TO_EXT_MAP.get('name').columnId, ValueType.STRING);
    }
    if (fclData.fclElements.stations.some(s => s.lat !== undefined)) {
        propCollector.push(Constants.STATION_PROP_INT_TO_EXT_MAP.get('lat').columnId, ValueType.DOUBLE);
    }
    if (fclData.fclElements.stations.some(s => s.lon !== undefined)) {
        propCollector.push(Constants.STATION_PROP_INT_TO_EXT_MAP.get('lon').columnId, ValueType.DOUBLE);
    }
    fclData.fclElements.stations.forEach(
        station => station.properties.forEach(stringProp => propCollector.push(stringProp.name, ValueType.STRING))
    );

    return propCollector.getList();
}
