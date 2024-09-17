import {
    Color,
    GraphType,
    MapType,
    GISData,
    DeliveryData,
    StationData,
    GroupType,
    ObservedType,
} from "../data.model";
import { List, Map } from "immutable";
import { ExampleData } from "@app/main-page/model/types";
import * as _ from "lodash";
import { concat, Utils } from "./non-ui-utils";
import { LABELS } from "./labels";

interface ColumnDefinition {
    id: string;
    name: string;
    availableForHighlighting?: boolean;
}

export class Constants {
    static readonly EXAMPLE_DATA_BASE_DIR = "assets/example-data/";
    static readonly EXAMPLE_DATA_SUB_DIR_1 = "baby-tea/";
    static readonly EXAMPLE_DATA_FILE_STRUCTURE: ExampleData[] = [
        {
            name: "Example Data",
            path: Constants.EXAMPLE_DATA_BASE_DIR + "ExampleData.json",
        },
        {
            name: "Babytea",
            path:
                Constants.EXAMPLE_DATA_BASE_DIR +
                Constants.EXAMPLE_DATA_SUB_DIR_1,
            children: [
                {
                    name: "Scenario 1",
                    path:
                        Constants.EXAMPLE_DATA_BASE_DIR +
                        Constants.EXAMPLE_DATA_SUB_DIR_1 +
                        "Scenario_1_Outbreak-Baby-Tea.json",
                },
                {
                    name: "Scenario 2",
                    path:
                        Constants.EXAMPLE_DATA_BASE_DIR +
                        Constants.EXAMPLE_DATA_SUB_DIR_1 +
                        "Scenario_2_LaSource.json",
                },
                {
                    name: "Scenario 3",
                    path:
                        Constants.EXAMPLE_DATA_BASE_DIR +
                        Constants.EXAMPLE_DATA_SUB_DIR_1 +
                        "Scenario_3_All-Stations.json",
                },
            ],
        },
    ];

    static readonly DIALOG_CANCEL = "Cancel";
    static readonly DIALOG_OK = "Ok";
    static readonly DIALOG_SAVE = "Save";
    static readonly DIALOG_DONT_SAVE = "Don't save and proceed";

    private static readonly STATION_DATA: StationData = {
        id: "",
        anonymizedName: "",
        name: "",
        lat: NaN,
        lon: NaN,
        incoming: [],
        outgoing: [],
        connections: [],
        invisible: false,
        expInvisible: false,
        contained: false,
        contains: [],
        isMeta: false,
        groupType: GroupType.SIMPLE_CHAIN,
        selected: false,
        observed: ObservedType.NONE,
        outbreak: false,
        crossContamination: false,
        killContamination: false,
        weight: 0,
        forward: false,
        backward: false,
        score: 0,
        commonLink: false,
        properties: [],
    };

    private static readonly DELIVERY_DATA: DeliveryData = {
        id: "",
        name: "",
        lot: "",
        lotKey: "",
        dateIn: "",
        dateOut: "",
        source: "",
        target: "",
        originalSource: "",
        originalTarget: "",
        invisible: false,
        expInvisible: false,
        selected: false,
        crossContamination: false,
        killContamination: false,
        observed: ObservedType.NONE,
        outbreak: false,
        weight: 0,
        forward: false,
        backward: false,
        score: 0,
        properties: [],
    };

    static readonly ARROW_STRING = "->";

    static readonly STATION_PROPERTIES: List<keyof StationData> = List<
        keyof StationData
    >(Object.keys(Constants.STATION_DATA));

    static readonly DELIVERY_PROPERTIES = List<keyof DeliveryData>(
        Object.keys(Constants.DELIVERY_DATA),
    );

    static readonly PROPERTIES: Map<string, { name: string; color?: Color }> =
        Map({
            id: { name: LABELS.id },
            name: { name: LABELS.name },
            lot: { name: LABELS.lot },
            lat: { name: LABELS.lat },
            lon: { name: LABELS.lon },
            dateIn: { name: LABELS.dateIn },
            dateOut: { name: LABELS.dateOut },
            source: { name: LABELS.source },
            target: { name: LABELS.target },
            originalSource: { name: LABELS.originalSource },
            originalTarget: { name: LABELS.originalTarget },
            incoming: { name: LABELS.incoming },
            outgoing: { name: LABELS.outgoing },
            contains: { name: LABELS.contains },
            isMeta: { name: LABELS.isMeta },
            forward: { name: LABELS.forward, color: { r: 150, g: 255, b: 75 } },
            backward: {
                name: LABELS.backward,
                color: { r: 255, g: 150, b: 75 },
            },
            observed: {
                name: LABELS.traceType,
                color: { r: 75, g: 150, b: 255 },
            },
            outbreak: {
                name: LABELS.outbreak,
                color: { r: 255, g: 50, b: 50 },
            },
            crossContamination: {
                name: LABELS.crossContamination,
                color: { r: 150, g: 150, b: 150 },
            },
            killContamination: { name: LABELS.killContamination },
            commonLink: {
                name: LABELS.commonLink,
                color: { r: 255, g: 255, b: 75 },
            },
            score: { name: LABELS.score },
            weight: { name: LABELS.weight, color: { r: 255, g: 0, b: 0 } },
        });

    static readonly PROPERTIES_WITH_COLORS = List(
        Constants.PROPERTIES.filter((p) => p?.color != null).keys(),
    );

    static readonly GRAPH_TYPES = List.of(GraphType.GRAPH, GraphType.GIS);
    static readonly FONT_SIZES = List.of(10, 12, 14, 18, 24, 48);
    static readonly NODE_SIZES = List.of(4, 6, 10, 14, 20, 30, 50);
    private static readonly EXPLICIT_EDGE_WIDTHS = [1, 2, 3, 5, 10, 20]; // from da
    private static readonly NODE_SIZE_TO_EDGE_WIDTH_FACTOR = 20;
    static readonly NODE_SIZE_TO_EDGE_WIDTH_MAP = Map<number, number>(
        Constants.NODE_SIZES.toArray().map((nodeSize) => [
            nodeSize,
            Number(
                (
                    nodeSize / Constants.NODE_SIZE_TO_EDGE_WIDTH_FACTOR
                ).toPrecision(1),
            ), // edgeWidth
        ]),
    );

    static readonly EDGE_WIDTHS = List<number>(
        _.uniq(
            concat(
                Constants.EXPLICIT_EDGE_WIDTHS,
                Constants.NODE_SIZE_TO_EDGE_WIDTH_MAP.toArray(),
            ).sort(Utils.compareNumbers),
        ),
    );

    static readonly GEOJSON_BORDER_WIDTHS = Constants.EDGE_WIDTHS;
    static readonly DEFAULT_GEOJSON_BORDER_WIDTH = 0.5;
    static readonly DEFAULT_GEOJSON_BORDER_COLOR = {
        r: 0,
        g: 0,
        b: 0,
    } as Readonly<Color>;

    static readonly DEFAULT_GRAPH_TYPE = GraphType.GRAPH;
    static readonly MAP_TYPES: Record<MapType, GISData> = {
        [MapType.MAPNIK]: {
            mapLayer: MapType.MAPNIK,
            shapeLayer: null,
            name: "Mapnik",
        },
        // the following code is commented because
        // the Black & White Map might be deactivatd only temporaryly
        //[MapType.BLACK_AND_WHITE]: {mapLayer: MapType.BLACK_AND_WHITE, shapeLayer: null, name: 'Black & White'},
        [MapType.SHAPE_FILE]: {
            mapLayer: null,
            shapeLayer: MapType.SHAPE_FILE,
            name: "Shape File",
        },
        [MapType.SHAPE_FILE_ON_MAP]: {
            mapLayer: MapType.MAPNIK, //TO_DO: Make dynamic
            shapeLayer: MapType.SHAPE_FILE,
            name: "Shape File on Map",
        },
    };

    static readonly DEFAULT_MAP_TYPE = Constants.MAP_TYPES[MapType.MAPNIK];

    static readonly DEFAULT_GRAPH_NODE_SIZE = 14;
    static readonly DEFAULT_GRAPH_ADJUST_EDGE_WIDTH_TO_NODE_SIZE = true;
    static readonly DEFAULT_GRAPH_EDGE_WIDTH =
        Constants.NODE_SIZE_TO_EDGE_WIDTH_MAP.get(
            Constants.DEFAULT_GRAPH_NODE_SIZE,
        );
    static readonly DEFAULT_GRAPH_FONT_SIZE = 14;
    static readonly DEFAULT_GRAPH_MERGE_DELIVERIES = false;
    static readonly DEFAULT_SKIP_UNCONNECTED_STATIONS = false;
    static readonly DEFAULT_GRAPH_SHOW_LEGEND = true;
    static readonly DEFAULT_GRAPH_SHOW_ZOOM = true;
    static readonly DEFAULT_FIT_GRAPH_TO_VISIBLE_AREA = true;
    static readonly DEFAULT_GIS_AVOID_OVERLAY = false;

    static readonly DEFAULT_TABLE_WIDTH = 0.25;

    static readonly COLUMN_ANONYMIZED_NAME: keyof StationData =
        "anonymizedName";
    static readonly COLUMN_NAME: keyof StationData = "name";
    static readonly DEFAULT_TABLE_STATION_COLUMNS = List.of(
        "name",
        "country",
        "typeOfBusiness",
        "score",
        "commonLink",
    );

    static readonly FAVOURITE_STAT_COLUMNS = List.of<ColumnDefinition>(
        { id: "id", name: LABELS.id },
        {
            id: "anonymizedName",
            name: LABELS.anonymizedName,
            availableForHighlighting: false,
        },
        { id: "name", name: LABELS.name },
        { id: "address", name: LABELS.address },
        { id: "country", name: LABELS.country },
        { id: "typeOfBusiness", name: LABELS.typeOfBusiness },
        { id: "score", name: LABELS.score },
        { id: "commonLink", name: LABELS.commonLink },
        { id: "outbreak", name: LABELS.outbreak },
        { id: "weight", name: LABELS.weight },
    );

    static readonly KNOWN_OTHER_STAT_COLUMNS = List.of<ColumnDefinition>(
        { id: "forward", name: `On ${LABELS.forward}` },
        { id: "backward", name: `On ${LABELS.backward}` },
        { id: "crossContamination", name: LABELS.crossContamination },
        { id: "killContamination", name: LABELS.killContamination },
        { id: "observed", name: LABELS.traceType },
        {
            id: "selected",
            name: LABELS.selected,
            availableForHighlighting: false,
        },
        {
            id: "invisible",
            name: LABELS.invisible,
            availableForHighlighting: false,
        },
        { id: "lat", name: LABELS.lat },
        { id: "lon", name: LABELS.lon },
        { id: "isMeta", name: LABELS.isMeta },
        {
            id: "contained",
            name: LABELS.contained,
            availableForHighlighting: false,
        },
    );

    static readonly DEFAULT_TABLE_DELIVERY_COLUMNS = List.of(
        "name",
        "lot",
        "amount",
        "dateOut",
        "dateIn",
        "source.name",
        "target.name",
    );

    static readonly DELIVERYTABLE_LOTKEYCOLUMN = "Product_k";

    static readonly COLOR_BLACK: Color = { r: 0, g: 0, b: 0 };
    static readonly COLOR_WHITE: Color = { r: 255, g: 255, b: 255 };

    static readonly DEFAULT_FILL_COLOR = this.COLOR_WHITE;
    static readonly DEFAULT_STROKE_COLOR = this.COLOR_BLACK;
    static readonly HOVER_FILL_COLOR: Color = { r: 128, g: 128, b: 255 };
    static readonly HOVER_STROKE_COLOR: Color = { r: 0, g: 0, b: 255 };
    static readonly INVISIBLE_COLOR: Color = { r: 211, g: 211, b: 211 };
}
