
import { GroupType, OperationType, ValueType, NodeShapeType, MergeDeliveriesType, Connection,
    StationStoreData, DeliveryStoreData } from '../../data.model';
import { Map as ImmutableMap, List as ImmutableList } from 'immutable';
import * as ExtDataConstants from './../ext-data-constants.v1';
import { Constants as IntDataConstants } from '../../util/constants';
import { DataTable, DataRow, JsonData, DeliveryHighlightingData, StationHighlightingData, ColumnProperty } from '../ext-data-model.v1';
import { Utils } from '../../util/non-ui-utils';
import { STATION_PROP_TO_REQ_TYPE_MAP, DELIVERY_PROP_TO_REQ_TYPE_MAP, DEL2DEL_PROP_TO_REQ_TYPE_MAP } from '../int-data-constants';
import { isValueTypeValid } from './shared';
import * as _ from 'lodash';

export interface ColumnInfo {
    columnId: string;
    type: string;
}

interface PropMap extends Map<string, string> {

}

interface AltPropMap {
    [key: string]: string | RegExp;
}

function getAvailableProps(table: DataTable): { [key: string]: string } {
    const tmp = Utils.createObjectFromArray(
        table.columnProperties,
        (colProp: ColumnProperty) => colProp.id,
        (colProp: ColumnProperty) => colProp.type
    );
    return tmp;
}

export const DONT_APPLY_VALUES_FOR_EXT_STATION_COLS: ImmutableList<string> = ImmutableList([
    ExtDataConstants.STATION_BACKWARD,
    ExtDataConstants.STATION_FORWARD,
    ExtDataConstants.STATION_ISMETA,
    ExtDataConstants.STATION_KILLCONTAMINATION,
    ExtDataConstants.STATION_OBSERVED,
    ExtDataConstants.STATION_SCORE,
    ExtDataConstants.STATION_WEIGHT,
    ExtDataConstants.STATION_CROSSCONTAMINATION,
    ExtDataConstants.STATION_NORM_SCORE,
    ExtDataConstants.STATION_MAX_LOT_SCORE,
    ExtDataConstants.STATION_POS_SCORE,
    ExtDataConstants.STATION_NEG_SCORE
]);

export const DONT_APPLY_VALUES_FOR_EXT_DELIVERY_COLS: ImmutableList<string> = ImmutableList([
    ExtDataConstants.DELIVERY_BACKWARD,
    ExtDataConstants.DELIVERY_FORWARD,
    ExtDataConstants.DELIVERY_KILLCONTAMINATION,
    ExtDataConstants.DELIVERY_OBSERVED,
    ExtDataConstants.DELIVERY_SCORE,
    ExtDataConstants.DELIVERY_WEIGHT,
    ExtDataConstants.DELIVERY_CROSSCONTAMINATION,
    ExtDataConstants.DELIVERY_NORM_SCORE,
    ExtDataConstants.DELIVERY_LOT_SCORE,
    ExtDataConstants.DELIVERY_POS_SCORE,
    ExtDataConstants.DELIVERY_NEG_SCORE
]);

export const DEFAULT_STATION_PROP_INT_TO_EXT_MAP: ImmutableMap<
    string,
    string
> = ImmutableMap({
    id: ExtDataConstants.STATION_ID,
    name: ExtDataConstants.STATION_NAME,
    country: ExtDataConstants.STATION_COUNTRY,
    address: ExtDataConstants.STATION_ADDRESS,
    lat: ExtDataConstants.STATION_LAT,
    lon: ExtDataConstants.STATION_LON,
    typeOfBusiness: ExtDataConstants.STATION_TYPE_OF_BUSINESS_CC,
    score: ExtDataConstants.STATION_SCORE,
    weight: ExtDataConstants.STATION_WEIGHT,
    observed: ExtDataConstants.STATION_OBSERVED,
    crossContamination: ExtDataConstants.STATION_CROSSCONTAMINATION,
    killContamination: ExtDataConstants.STATION_KILLCONTAMINATION
});

export const DEFAULT_DEL2DEL_PROP_INT_TO_EXT_MAP: ImmutableMap<
    string,
    string
> = ImmutableMap({
    source: ExtDataConstants.DEL2DEL_FROM,
    target: ExtDataConstants.DEL2DEL_TO
});

const DEL2DEL_PROPS_INT_TO_EXT_ALT_MAP: ImmutableList<
    { [key: string]: string | RegExp }
> = ImmutableList([
    {
        source: ExtDataConstants.DEL2DEL_ID,
        target: ExtDataConstants.DEL2DEL_NEXT
    }
]);

const STATION_PROPS_INT_TO_EXT_ALT_MAP: ImmutableList<
    { [key: string]: string | RegExp }
> = ImmutableList([
    {
        lat: ExtDataConstants.STATION_GLAT_REGEX,
        lon: ExtDataConstants.STATION_GLON_REGEX
    },
    { typeOfBusiness: ExtDataConstants.STATION_TYPE_OF_BUSINESS_REGEX }
]);

export const DEFAULT_DELIVERY_PROP_INT_TO_EXT_MAP: ImmutableMap<
    string,
    string
> = ImmutableMap({
    id: ExtDataConstants.DELIVERY_ID,
    name: ExtDataConstants.DELIVERY_NAME,
    source: ExtDataConstants.DELIVERY_FROM,
    target: ExtDataConstants.DELIVERY_TO,
    lot: ExtDataConstants.DELIVERY_LOT_ID,
    lotKey: ExtDataConstants.DELIVERY_PRODUCT_K,
    weight: ExtDataConstants.DELIVERY_WEIGHT,
    crossContamination: ExtDataConstants.DELIVERY_CROSSCONTAMINATION,
    killContamination: ExtDataConstants.DELIVERY_KILLCONTAMINATION,
    forward: ExtDataConstants.DELIVERY_FORWARD,
    backward: ExtDataConstants.DELIVERY_BACKWARD,
    score: ExtDataConstants.DELIVERY_SCORE,
    observed: ExtDataConstants.DELIVERY_OBSERVED,
    date: ExtDataConstants.DELIVERY_OUT_DATE
});

const DELIVERY_PROPS_INT_TO_EXT_ALT_MAP: ImmutableList<
    { [key: string]: string | RegExp }
> = ImmutableList([]);

function getMatchingProp(availableProps: string[], key: string | RegExp): string {
    if (typeof key === 'string') {
        if (availableProps.includes(key)) {
            return key;
        }
    } else {
        for (const prop of availableProps) {
            if (key.test(prop)) {
                return prop;
            }
        }
        return undefined;
    }
}

function getPropMap(
    table: DataTable,
    referencedProps: string[],
    defaultMap: ImmutableMap<string, string>,
    altMapList: ImmutableList<{ [key: string]: string | RegExp }>,
    explicitProps: string[]
): PropMap {
    const availableExtProps = Object.keys(getAvailableProps(table));
    const availableExtPropsSet = Utils.createSimpleStringSet(availableExtProps);
    const availableExtPropsLC = availableExtProps.map(extProp => extProp.toLowerCase());
    const propMap = defaultMap.toObject();
    for (const [intProp, defaultExtProp] of Object.entries(propMap)) {
        // check for availability of default mapping
        if (availableExtPropsSet[defaultExtProp] === undefined) {
            // default mapping is not available, try lower case match
            const matchingExtPropIndex = availableExtPropsLC.indexOf(defaultExtProp.toLowerCase());
            if (matchingExtPropIndex >= 0) {
                propMap[intProp] = availableExtProps[matchingExtPropIndex];
            }
        }
    }
    // look for alternative mappings
    altMapList.forEach((propSet: AltPropMap) => {
        const intProps = Object.keys(propSet);
        // Check whether all (internal) props of the propSet are already mapped to an available external prop
        if (intProps.some(intProp => availableExtPropsSet[propMap[intProp]] === undefined)) {
            // At least one internal prop of the propSet is not mapped to an available external prop yet
            // get an alternative map
            const altPropMap = Utils.createObjectFromArray(
                intProps,
                intProp => intProp,
                intProp => getMatchingProp(availableExtProps, propSet[intProp])
            );
            // are all alternative mappings for all props in the set available
            if (intProps.every(intProp => altPropMap[intProp] !== undefined)) {
                // yes, apply alternative mappings
                intProps.forEach(intProp => {
                    propMap[intProp] = altPropMap[intProp];
                });
            }
        }
    });
    const unmappedExtProps = [...availableExtProps, ...referencedProps].filter(extProp => !Object.values(propMap).includes(extProp));
    unmappedExtProps.forEach(extProp => {
        if (
            propMap[extProp] === undefined && // extProp is not an internal prop
            !explicitProps.includes(extProp) // extProp is not an explicit prop
        ) {
            propMap[extProp] = extProp;
        } else {
            propMap['external' + extProp.slice(0, 1).toUpperCase() + extProp.slice(1)] = extProp;
        }
    });
    return new Map(Object.entries(propMap));
}

// retrieves all props referenced in HighlightingData
function getReferencedProps(highlightingConditions: (StationHighlightingData | DeliveryHighlightingData)[]): string[] {
    return (
        highlightingConditions ?
        [].concat(...highlightingConditions.map(
            hCon => [
                hCon.labelProperty,
                ...(
                    hCon.logicalConditions ?
                    [].concat(...hCon.logicalConditions.map(logConA => logConA.map(logCon => logCon.propertyName))) :
                    []
                ),
                ...hCon.valueCondition ? [hCon.valueCondition.propertyName] : []
            ]
        )).filter(prop => prop !== undefined && prop !== null) :
        []
    );
}

export function getStationPropMap(jsonData: JsonData): PropMap {
    return getPropMap(
        jsonData.data.stations,
        getReferencedProps(
            (
                jsonData.settings &&
                jsonData.settings.view &&
                jsonData.settings.view.node &&
                jsonData.settings.view.node.highlightConditions
             ) ?
            jsonData.settings.view.node.highlightConditions :
            []
        ),
        DEFAULT_STATION_PROP_INT_TO_EXT_MAP,
        STATION_PROPS_INT_TO_EXT_ALT_MAP,
        IntDataConstants.STATION_PROPERTIES.toArray()
    );
}

export function getDeliveryPropMap(jsonData: JsonData): PropMap {
    return getPropMap(
        jsonData.data.deliveryRelations,
        getReferencedProps(
            (
                jsonData.settings &&
                jsonData.settings.view &&
                jsonData.settings.view.edge &&
                jsonData.settings.view.edge.highlightConditions
             ) ?
            jsonData.settings.view.edge.highlightConditions :
            []
        ),
        DEFAULT_DELIVERY_PROP_INT_TO_EXT_MAP,
        DELIVERY_PROPS_INT_TO_EXT_ALT_MAP,
        IntDataConstants.DELIVERY_PROPERTIES.toArray()
    );
}

export function getDel2DelPropMap(jsonData: JsonData): PropMap {
    return getPropMap(
        jsonData.data.deliveryRelations,
        [],
        DEFAULT_DEL2DEL_PROP_INT_TO_EXT_MAP,
        DEL2DEL_PROPS_INT_TO_EXT_ALT_MAP,
        []
    );
}

export const DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_ID_NEXT: ImmutableMap<
    string,
    ColumnInfo
> = ImmutableMap({
    source: { columnId: 'ID', type: 'string' },
    target: {
        columnId: 'Next',
        type: 'string'
    }
});

export const DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO: ImmutableMap<
    string,
    ColumnInfo
> = ImmutableMap({
    source: { columnId: 'from', type: 'string' },
    target: {
        columnId: 'to',
        type: 'string'
    }
});

export const GROUPTYPE_EXT_TO_INT_MAP: ImmutableMap<
    string,
    GroupType
> = ImmutableMap({
    SimpleChain: GroupType.SIMPLE_CHAIN,
    SourceGroup: GroupType.TARGET_GROUP,
    TargetGroup: GroupType.TARGET_GROUP,
    IsolatedGroup: GroupType.ISOLATED_GROUP
});

export function NODE_SIZE_EXT_TO_INT_FUN(ext: string): number {
    const extV: number = +ext;
    if (isNaN(extV)) {
        return IntDataConstants.DEFAULT_GRAPH_NODE_SIZE;
    } else {
        return IntDataConstants.NODE_SIZES.toArray().reduce(
            (prevV, curV) => Math.abs(prevV - extV) > Math.abs(curV - extV) ? curV : prevV,
            IntDataConstants.DEFAULT_GRAPH_NODE_SIZE
        );
    }
}

export function FONT_SIZE_EXT_TO_INT_FUN(ext: string): number {
    const extV: number = +ext;
    if (isNaN(extV)) {
        return IntDataConstants.DEFAULT_GRAPH_FONT_SIZE;
    } else {
        return IntDataConstants.FONT_SIZES.toArray().reduce(
            (prevV, curV) => Math.abs(prevV - extV) > Math.abs(curV - extV) ? curV : prevV,
            IntDataConstants.DEFAULT_GRAPH_FONT_SIZE
        );
    }
}

export const MERGE_DEL_TYPE_EXT_TO_INT_MAP: ImmutableMap<
    string,
    MergeDeliveriesType
> = ImmutableMap({
    NO_MERGE: MergeDeliveriesType.NO_MERGE,
    MERGE_ALL: MergeDeliveriesType.MERGE_ALL,
    MERGE_LOT_WISE: MergeDeliveriesType.MERGE_LOT_WISE,
    MERGE_PRODUCT_WISE: MergeDeliveriesType.MERGE_PRODUCT_WISE,
    MERGE_LABEL_WISE: MergeDeliveriesType.MERGE_LABEL_WISE
});

export const OPERATION_TYPE_EXT_TO_INT_MAP: ImmutableMap<string, OperationType> = ImmutableMap({
    'EQUAL': OperationType.EQUAL,
    'GREATER': OperationType.GREATER,
    'NOT_EQUAL': OperationType.NOT_EQUAL,
    'LESS': OperationType.LESS,
    'REGEX_EQUAL': OperationType.REGEX_EQUAL,
    'REGEX_NOT_EQUAL': OperationType.REGEX_NOT_EQUAL,
    'REGEX_EQUAL_IGNORE_CASE': OperationType.REGEX_EQUAL_IGNORE_CASE,
    'REGEX_NOT_EQUAL_IGNORE_CASE': OperationType.REGEX_NOT_EQUAL_IGNORE_CASE
});

export const VALUE_TYPE_EXT_TO_INT_MAP: ImmutableMap<string, ValueType> = ImmutableMap({
    'VALUE': ValueType.VALUE,
    'LOG_VALUE': ValueType.LOG_VALUE
});

export const NODE_SHAPE_TYPE_EXT_TO_INT_MAP: ImmutableMap<string, NodeShapeType> = ImmutableMap({
    'CIRCLE': NodeShapeType.CIRCLE,
    'SQUARE': NodeShapeType.SQUARE,
    'TRIANGLE': NodeShapeType.TRIANGLE,
    'TRIANGLEREV': NodeShapeType.PENTAGON,
    'TRIANGLERIGHT': NodeShapeType.HEXAGON,
    'TRIANGLELEFT': NodeShapeType.OCTAGON,
    'STAR': NodeShapeType.STAR,
    'DIAMOND': NodeShapeType.DIAMOND
});

export class PropMapper {
    private extToIntPropMap: Map<string, string>;
    private dontApplyExtProps: { [key: string]: boolean };
    private directProps: Set<string>;

    constructor(
        private intToExtPropMap: PropMap,
        dontApplyExtProps: string[],
        directProps: string[],
        private propToTypeMap: ImmutableMap<string, string>
    ) {
        this.extToIntPropMap = Utils.createReverseMap(intToExtPropMap);
        this.dontApplyExtProps = Utils.createSimpleStringSet(dontApplyExtProps);
        this.directProps = new Set(directProps);
    }

    applyValuesFromTableRow(fromRow: DataRow, toObj: Connection | StationStoreData | DeliveryStoreData): void {
        for (const property of fromRow) {
            if (!this.dontApplyExtProps[property.id]) {
                if (this.extToIntPropMap.has(property.id)) {
                    const intProp = this.extToIntPropMap.get(property.id);
                    const reqType = this.propToTypeMap.get(intProp);
                    if (reqType && !isValueTypeValid(property.value, reqType)) {
                        throw new Error(
                            `Invalid property type. The type of value '${property.value}' of \
                            property '${property.id}' is ${typeof property.value} but is required to be ${reqType}`
                        );
                    } else if (this.directProps.has(intProp)) {
                        toObj[intProp] = property.value;
                    } else if (toObj['properties']) {
                        (toObj as StationStoreData | DeliveryStoreData).properties.push({
                            name: intProp,
                            value: (
                                property.value !== null && property.value !== undefined && typeof(property.value) !== 'string' ?
                                property.value.toString() :
                                property.value
                            ) as string
                        });
                    }
                }
            }
        }
    }

    getPropMap(): PropMap {
        return this.intToExtPropMap;
    }
}

export function getStationPropMapper(jsonData: JsonData): PropMapper {
    return new PropMapper(
        getStationPropMap(jsonData),
        DONT_APPLY_VALUES_FOR_EXT_STATION_COLS.toArray(),
        IntDataConstants.STATION_PROPERTIES.toArray(),
        STATION_PROP_TO_REQ_TYPE_MAP
    );
}

export function getDeliveryPropMapper(jsonData: JsonData): PropMapper {
    return new PropMapper(
        getDeliveryPropMap(jsonData),
        DONT_APPLY_VALUES_FOR_EXT_DELIVERY_COLS.toArray(),
        IntDataConstants.DELIVERY_PROPERTIES.toArray(),
        DELIVERY_PROP_TO_REQ_TYPE_MAP
    );
}

export function getDel2DelPropMapper(jsonData: JsonData): PropMapper {
    return new PropMapper(
        getDel2DelPropMap(jsonData),
        [],
        DEL2DEL_PROP_TO_REQ_TYPE_MAP.keySeq().toArray(),
        DEL2DEL_PROP_TO_REQ_TYPE_MAP
    );
}
