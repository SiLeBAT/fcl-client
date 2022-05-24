import { Color, GraphType, MapType, DeliveryData, StationData } from '../data.model';
import { List, Map } from 'immutable';

export class Constants {
    static readonly EXAMPLE_MODEL_FILE_PATH = 'assets/data/ExampleData.json';

    private static readonly STATION_DATA: StationData = {
        id: null,
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
            score: { name: 'Score', color: null }
        }
    );
    static readonly PROPERTIES_WITH_COLORS = List(
        Constants.PROPERTIES.filter(p => p.color != null).keys()
    );

    static readonly GRAPH_TYPES = List.of(GraphType.GRAPH, GraphType.GIS);
    static readonly FONT_SIZES = List.of(10, 12, 14, 18, 24);
    static readonly NODE_SIZES = List.of(4, 6, 10, 14, 20, 30, 50);

    static readonly DEFAULT_GRAPH_TYPE = GraphType.GRAPH;
    static readonly DEFAULT_MAP_TYPE = MapType.MAPNIK;
    static readonly DEFAULT_GRAPH_NODE_SIZE = 20;
    static readonly DEFAULT_GRAPH_FONT_SIZE = 10;
    static readonly DEFAULT_GRAPH_MERGE_DELIVERIES = false;
    static readonly DEFAULT_SKIP_UNCONNECTED_STATIONS = false;
    static readonly DEFAULT_GRAPH_SHOW_LEGEND = true;
    static readonly DEFAULT_GRAPH_SHOW_ZOOM = true;
    static readonly DEFAULT_GIS_AVOID_OVERLAY = false;

    static readonly DEFAULT_TABLE_WIDTH = 0.25;
    static readonly DEFAULT_TABLE_STATION_COLUMNS = List.of(
        'name',
        'country',
        'typeOfBusiness'
    );
    static readonly DEFAULT_TABLE_DELIVERY_COLUMNS = List.of(
        'id',
        'source',
        'target',
        'score'
    );

    static readonly DELIVERYTABLE_LOTKEYCOLUMN = 'Product_k';
}
