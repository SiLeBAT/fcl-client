import { GroupType, OperationType, ValueType, NodeShapeType, MergeDeliveriesType } from '../../data.model';
import { Map as ImmutableMap } from 'immutable';
import { Constants as OtherConstants } from '../../../tracing/util/constants';

export interface ColumnInfo {
    columnId: string;
    type: string;
}

export class Constants {
    static readonly DATA: string = 'data';
    static readonly SAMPLEDATA: string = 'samples';
    static readonly STATION_TABLE: string = 'stations';
    static readonly DELIVERY_TABLE: string = 'deliveries';
    static readonly DELIVERY_TO_DELIVERY_TABLE: string = 'deliveryRelations';
    static readonly TABLE_COLUMNS: string = 'columnProperties';
    static readonly TABLE_DATA: string = 'data';
    static readonly GROUP_DATA: string = 'settings.metaNodes';
    static readonly TRACING_DATA: string = 'tracing';
    static readonly VIEW_SETTINGS: string = 'settings.view';
    static readonly SHOW_GIS: string = 'showGis';
    static readonly SHOW_LEGEND: string = 'showLegend';
    static readonly MERGE_DELIVERIES: string = 'edge.joinEdges';
    static readonly SKIP_UNCONNECTED_STATIONS: string = 'node.skipEdgelessNodes';
    static readonly GISGRAPH_TRANSFORMATION: string = 'gis.transformation';
    static readonly SCHEMAGRAPH_TRANSFORMATION: string = 'graph.transformation';
    static readonly SCHEMAGRAPH_NODE_SIZE: string = 'graph.node.minSize';
    static readonly GISGRAPH_NODE_SIZE: string = 'gis.node.minSize';
    static readonly SCHEMAGRAPH_FONT_SIZE: string = 'graph.text.fontSize';
    static readonly GISGRAPH_FONT_SIZE: string = 'gis.text.fontSize';
    static readonly TRACING_DATA_STATIONS = 'nodes';
    static readonly TRACING_DATA_DELIVERIES = 'deliveries';
    static readonly NODE_POSITIONS = 'graph.node.positions';

    static readonly STATION_PROP_INT_TO_EXT_MAP: ImmutableMap<
        string,
        ColumnInfo
    > = ImmutableMap({
        id: { columnId: 'ID', type: 'string' },
        name: { columnId: 'Name', type: 'string' },
        lat: { columnId: 'GeocodingLatitude', type: 'double' },
        lon: {
            columnId: 'GeocodingLongitude',
            type: 'double'
        },
        weight: { columnId: 'Weight', type: 'double' },
        crossContamination: { columnId: 'CrossContamination', type: 'boolean' },
        killContamination: { columnId: 'KillContamination', type: 'boolean' },
        forward: { columnId: 'Forward', type: 'boolean' },
        backward: { columnId: 'Backward', type: 'boolean' },
        score: { columnId: 'Score', type: 'boolean' },
        isMeta: { columnId: 'IsMeta', type: 'boolean' },
        observed: { columnId: 'Observed', type: 'boolean' }
    });

    static readonly DELIVERY_PROP_INT_TO_EXT_MAP: ImmutableMap<
        string,
        ColumnInfo
    > = ImmutableMap({
        id: { columnId: 'ID', type: 'string' },
        name: { columnId: 'Name', type: 'string' },
        source: { columnId: 'from', type: 'string' },
        target: { columnId: 'to', type: 'string' },
        lot: { columnId: 'Lot ID', type: 'string' },
        lotKey: { columnId: 'Product_k', type: 'string' },
        weight: { columnId: 'Weight', type: 'double' },
        crossContamination: { columnId: 'CrossContamination', type: 'boolean' },
        killContamination: { columnId: 'KillContamination', type: 'boolean' },
        forward: { columnId: 'Forward', type: 'boolean' },
        backward: { columnId: 'Backward', type: 'boolean' },
        score: { columnId: 'Score', type: 'boolean' },
        observed: { columnId: 'Observed', type: 'boolean' }
    });

    static readonly DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_ID_NEXT: ImmutableMap<
        string,
        ColumnInfo
    > = ImmutableMap({
        source: { columnId: 'ID', type: 'string' },
        target: {
            columnId: 'Next',
            type: 'string'
        }
    });

    static readonly DELIVERY_TO_DELIVERY_PROP_INT_TO_EXT_MAP_V_FROM_TO: ImmutableMap<
        string,
        ColumnInfo
    > = ImmutableMap({
        source: { columnId: 'from', type: 'string' },
        target: {
            columnId: 'to',
            type: 'string'
        }
    });

    static readonly GROUPTYPE_EXT_TO_INT_MAP: ImmutableMap<
        string,
        GroupType
    > = ImmutableMap({
        SimpleChain: GroupType.SIMPLE_CHAIN,
        SourceGroup: GroupType.TARGET_GROUP,
        TargetGroup: GroupType.TARGET_GROUP,
        IsolatedGroup: GroupType.ISOLATED_GROUP
    });

    static readonly MERGE_DEL_TYPE_EXT_TO_INT_MAP: ImmutableMap<
        string,
        MergeDeliveriesType
    > = ImmutableMap({
        NO_MERGE: MergeDeliveriesType.NO_MERGE,
        MERGE_ALL: MergeDeliveriesType.MERGE_ALL,
        MERGE_LOT_WISE: MergeDeliveriesType.MERGE_LOT_WISE,
        MERGE_PRODUCT_WISE: MergeDeliveriesType.MERGE_PRODUCT_WISE,
        MERGE_LABEL_WISE: MergeDeliveriesType.MERGE_LABEL_WISE
    });

    static readonly OPERATION_TYPE_EXT_TO_INT_MAP: ImmutableMap<string, OperationType> = ImmutableMap({
        'EQUAL': OperationType.EQUAL,
        'GREATER': OperationType.GREATER,
        'NOT_EQUAL': OperationType.NOT_EQUAL,
        'LESS': OperationType.LESS,
        'REGEX_EQUAL': OperationType.REGEX_EQUAL,
        'REGEX_NOT_EQUAL': OperationType.REGEX_NOT_EQUAL,
        'REGEX_EQUAL_IGNORE_CASE': OperationType.REGEX_EQUAL_IGNORE_CASE,
        'REGEX_NOT_EQUAL_IGNORE_CASE': OperationType.REGEX_NOT_EQUAL_IGNORE_CASE
    });

    static readonly VALUE_TYPE_EXT_TO_INT_MAP: ImmutableMap<string, ValueType> = ImmutableMap({
        'VALUE': ValueType.VALUE,
        'LOG_VALUE': ValueType.LOG_VALUE
    });

    static readonly NODE_SHAPE_TYPE_EXT_TO_INT_MAP: ImmutableMap<string, NodeShapeType> = ImmutableMap({
        'CIRCLE': NodeShapeType.CIRCLE,
        'SQUARE': NodeShapeType.SQUARE,
        'TRIANGLE': NodeShapeType.TRIANGLE,
        'TRIANGLEREV': NodeShapeType.PENTAGON,
        'TRIANGLERIGHT': NodeShapeType.HEXAGON,
        'TRIANGLELEFT': NodeShapeType.OCTAGON,
        'STAR': NodeShapeType.STAR,
        'DIAMOND': NodeShapeType.DIAMOND
    });

    static NODE_SIZE_EXT_TO_INT_FUN(ext: string): number {
        const extV: number = +ext;
        if (isNaN(extV)) {
            return OtherConstants.DEFAULT_GRAPH_NODE_SIZE;
        } else {
            return OtherConstants.NODE_SIZES.toArray().reduce(
                (prevV, curV) => Math.abs(prevV - extV) > Math.abs(curV - extV) ? curV : prevV,
                OtherConstants.DEFAULT_GRAPH_NODE_SIZE
            );
        }
    }

    static FONT_SIZE_EXT_TO_INT_FUN(ext: string): number {
        const extV: number = +ext;
        if (isNaN(extV)) {
            return OtherConstants.DEFAULT_GRAPH_FONT_SIZE;
        } else {
            return OtherConstants.FONT_SIZES.toArray().reduce(
                (prevV, curV) => Math.abs(prevV - extV) > Math.abs(curV - extV) ? curV : prevV,
                OtherConstants.DEFAULT_GRAPH_FONT_SIZE
            );
        }
    }

}
