import { Color, GraphType, MapType, DeliveryData, StationData } from '../data.model';
import { List, Map } from 'immutable';
import { ExampleData } from '@app/main-page/model/types';
import * as _ from 'lodash';
import { Utils } from './non-ui-utils';

export class Constants {
    static readonly EXAMPLE_DATA_BASE_DIR = 'assets/example-data/';
    static readonly EXAMPLE_DATA_SUB_DIR_1 = 'baby-tea/';
    static readonly EXAMPLE_DATA_FILE_STRUCTURE: ExampleData[] = [
        {
            name: 'Example Data',
            path:  Constants.EXAMPLE_DATA_BASE_DIR + 'ExampleData.json'
        },
        {
            name: 'Babytea',
            path: Constants.EXAMPLE_DATA_BASE_DIR + Constants.EXAMPLE_DATA_SUB_DIR_1,
            children: [
                {
                    name: 'Scenario 1',
                    path:  Constants.EXAMPLE_DATA_BASE_DIR + Constants.EXAMPLE_DATA_SUB_DIR_1 + 'Scenario_1_Outbreak-Baby-Tea.json'
                },
                {
                    name: 'Scenario 2',
                    path:  Constants.EXAMPLE_DATA_BASE_DIR + Constants.EXAMPLE_DATA_SUB_DIR_1 + 'Scenario_2_LaSource.json'
                },
                {
                    name: 'Scenario 3',
                    path:  Constants.EXAMPLE_DATA_BASE_DIR + Constants.EXAMPLE_DATA_SUB_DIR_1 + 'Scenario_3_All-Stations.json'
                }
            ]
        }
    ];

    static readonly DIALOG_CANCEL = 'Cancel';
    static readonly DIALOG_OK = 'Ok';
    static readonly DIALOG_SAVE = 'Save';
    static readonly DIALOG_DONT_SAVE = 'Don\'t save and proceed';

    private static readonly STATION_DATA: StationData = {
        id: null,
        anonymizedName: null,
        name: null,
        lat: null,
        lon: null,
        incoming: null,
        outgoing: null,
        connections: null,
        invisible: null,
        expInvisible: false,
        contained: null,
        contains: null,
        isMeta: null,
        groupType: null,
        selected: null,
        observed: null,
        outbreak: null,
        crossContamination: null,
        killContamination: null,
        weight: null,
        forward: null,
        backward: null,
        score: null,
        commonLink: null,
        properties: null
    };

    private static readonly DELIVERY_DATA: DeliveryData = {
        id: null,
        name: null,
        lot: null,
        lotKey: null,
        dateIn: null,
        dateOut: null,
        source: null,
        target: null,
        originalSource: null,
        originalTarget: null,
        invisible: null,
        expInvisible: false,
        selected: null,
        crossContamination: null,
        killContamination: null,
        observed: null,
        weight: null,
        forward: null,
        backward: null,
        score: null,
        properties: null
    };

    static readonly ARROW_STRING = '->';

    static readonly STATION_PROPERTIES: List<keyof StationData> = List<keyof StationData>(
        Object.keys(Constants.STATION_DATA)
    );

    static readonly DELIVERY_PROPERTIES = List<keyof DeliveryData>(
        Object.keys(Constants.DELIVERY_DATA)
    );

    static readonly PROPERTIES: Map<string, { name: string; color: Color }> = Map(
        {
            id: { name: 'ID', color: null },
            name: { name: 'Name', color: null },
            lot: { name: 'Lot', color: null },
            lat: { name: 'Latitude', color: null },
            lon: { name: 'Longitude', color: null },
            dateIn: { name: 'Delivery Date Arrival', color: null },
            dateOut: { name: 'Delivery Date', color: null },
            source: { name: 'Source', color: null },
            target: { name: 'Target', color: null },
            originalSource: { name: 'Original Source', color: null },
            originalTarget: { name: 'Original Target', color: null },
            incoming: { name: 'Incoming', color: null },
            outgoing: { name: 'Outgoing', color: null },
            contains: { name: 'Contains', color: null },
            isMeta: { name: 'Is Meta Station', color: null },
            forward: { name: 'Forward Trace', color: { r: 150, g: 255, b: 75 } },
            backward: { name: 'Backward Trace', color: { r: 255, g: 150, b: 75 } },
            observed: { name: 'Observed', color: { r: 75, g: 150, b: 255 } },
            outbreak: { name: 'Outbreak', color: { r: 255, g: 50, b: 50 } },
            crossContamination: {
                name: 'Cross Contamination',
                color: { r: 150, g: 150, b: 150 }
            },
            killContamination: { name: 'Kill Contamination', color: null },
            commonLink: { name: 'Common Link', color: { r: 255, g: 255, b: 75 } },
            score: { name: 'Score', color: null },
            weight: { name: 'Weight', color: { r: 255, g: 0, b: 0 } }
        }
    );
    static readonly PROPERTIES_WITH_COLORS = List(
        Constants.PROPERTIES.filter(p => p.color != null).keys()
    );

    static readonly GRAPH_TYPES = List.of(GraphType.GRAPH, GraphType.GIS);
    static readonly FONT_SIZES = List.of(10, 12, 14, 18, 24, 48);
    static readonly NODE_SIZES = List.of(4, 6, 10, 14, 20, 30, 50);
    private static readonly EXPLICIT_EDGE_WIDTHS = [1, 2, 3, 5, 10, 20]; // from da
    private static readonly NODE_SIZE_TO_EDGE_WIDTH_FACTOR = 20;
    static readonly NODE_SIZE_TO_EDGE_WIDTH_MAP = Map<number, number>(
        Constants.NODE_SIZES.toArray().map(nodeSize => [
            nodeSize,
            Number((nodeSize/Constants.NODE_SIZE_TO_EDGE_WIDTH_FACTOR).toPrecision(1)) // edgeWidth
        ])
    );

    static readonly EDGE_WIDTHS = List<number>(_.uniq(
        [].concat(
            Constants.EXPLICIT_EDGE_WIDTHS,
            Constants.NODE_SIZE_TO_EDGE_WIDTH_MAP.toArray()
        ).sort(Utils.compareNumbers)
    ));

    static readonly GEOJSON_BORDER_WIDTHS = Constants.EDGE_WIDTHS;
    static readonly DEFAULT_GEOJSON_BORDER_WIDTH = 0.5;
    static readonly DEFAULT_GEOJSON_BORDER_COLOR = { r: 0, g: 0, b: 0 } as Readonly<Color>;

    static readonly DEFAULT_GRAPH_TYPE = GraphType.GRAPH;
    static readonly DEFAULT_MAP_TYPE = MapType.MAPNIK;
    static readonly DEFAULT_GRAPH_NODE_SIZE = 14;
    static readonly DEFAULT_GRAPH_ADJUST_EDGE_WIDTH_TO_NODE_SIZE = true;
    static readonly DEFAULT_GRAPH_EDGE_WIDTH = Constants.NODE_SIZE_TO_EDGE_WIDTH_MAP.get(Constants.DEFAULT_GRAPH_NODE_SIZE);
    static readonly DEFAULT_GRAPH_FONT_SIZE = 14;
    static readonly DEFAULT_GRAPH_MERGE_DELIVERIES = false;
    static readonly DEFAULT_SKIP_UNCONNECTED_STATIONS = false;
    static readonly DEFAULT_GRAPH_SHOW_LEGEND = true;
    static readonly DEFAULT_GRAPH_SHOW_ZOOM = true;
    static readonly DEFAULT_FIT_GRAPH_TO_VISIBLE_AREA = true;
    static readonly DEFAULT_GIS_AVOID_OVERLAY = false;

    static readonly DEFAULT_TABLE_WIDTH = 0.25;

    static readonly COLUMN_ANONYMIZED_NAME: keyof StationData = 'anonymizedName';
    static readonly COLUMN_NAME: keyof StationData = 'name';
    static readonly DEFAULT_TABLE_STATION_COLUMNS = List.of(
        'name',
        'country',
        'typeOfBusiness',
        'score',
        'commonLink'
    );

    static readonly FAVOURITE_STAT_COLUMNS_INCL_ANO = List.of<{ id: string; name: string }>(
        { id: 'id', name: 'ID' },
        { id: 'anonymizedName', name: 'Anonymized Name' },
        { id: 'name', name: 'Name' },
        { id: 'address', name: 'Address' },
        { id: 'country', name: 'Country' },
        { id: 'typeOfBusiness', name: 'Type of Business' },
        { id: 'score', name: 'Score' },
        { id: 'commonLink', name: 'Common Link' },
        { id: 'outbreak', name: 'Outbreak' },
        { id: 'weight', name: 'Weight' }
    );

    static readonly FAVOURITE_STAT_COLUMNS_EXCL_ANO = List.of<{ id: string; name: string }>(
        ...this.FAVOURITE_STAT_COLUMNS_INCL_ANO.toArray().filter(c => c.id !== 'anonymizedName')
    );

    static readonly DEFAULT_TABLE_DELIVERY_COLUMNS = List.of(
        'name',
        'lot',
        'amount',
        'dateOut',
        'dateIn',
        'source.name',
        'target.name'
    );

    static readonly DELIVERYTABLE_LOTKEYCOLUMN = 'Product_k';
}
