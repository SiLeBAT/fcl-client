import { MapConfig, MapType, TileServer, ShapeFileData } from "../data.model";
import { OSM } from "ol/source";
import * as ol from "ol";
import BaseLayer from "ol/layer/Base";
import VectorLayer from "ol/layer/Vector";
import { Tile } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { GeoJSON } from "ol/format";
import { Stroke, Style } from "ol/style";
import { InputDataError } from "../io/io-errors";
import { StyleLike } from "ol/style/Style";
import { NotNullish, NotNullishPick } from "./utility-types";

type MapConfigWithOptLayout = Partial<Pick<MapConfig, "layout">> &
    Omit<MapConfig, "layout">;
type ShapeMapConfig = NotNullish<
    Pick<MapConfig, "lineColor" | "lineWidth" | "shapeFileData">
>;
type ShapeMapStyleConfig = Pick<ShapeMapConfig, "lineColor" | "lineWidth">;

export interface RectConfig {
    left: number;
    right: number;
    top: number;
    bottom: number;
    borderWidth: number;
}

const LAYER_ID_KEY = "layerId";
const MAP_LAYER_ID = "MapLayer";

const MAP_SOURCE: Map<TileServer, () => OSM> = new Map([
    [TileServer.MAPNIK, () => new OSM()],
    // the following code is commented because
    // the Black & White Map might be deactivatd only temporarily
    // [TileServer.BLACK_AND_WHITE, () => new OSM({
    //     url: 'https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
    //     crossOrigin: null
    // })]
]);

//* ***** Question START: Is this code still needed? It doesn't seem to be in use anywhere. ***** */

// the following code is commented because
// the Black & White Map might be deactivatd only temporarily
const availableMapTypes: TileServer[] = [
    TileServer.MAPNIK /*TileServer.BLACK_AND_WHITE*/,
];

export function getAvailableMapTypes(): TileServer[] {
    return availableMapTypes;
}

//* ***** Question END: ***** */

export function createOpenLayerMap(
    mapConfig: MapConfigWithOptLayout,
    target?: HTMLElement,
): ol.Map {
    const map = new ol.Map({
        target: target,
        layers: createMapLayer(mapConfig),
        controls: [],
    });
    return map;
}

function createMapLayer(mapConfig: MapConfigWithOptLayout): Array<BaseLayer> {
    const {
        mapType: { mapLayer, shapeLayer },
    } = mapConfig;

    // create a multi-layer map if both layers are present
    if (mapLayer !== null && shapeLayer !== null) {
        const topLayer = createShapeFileLayer(mapConfig as ShapeMapConfig);
        topLayer.set(LAYER_ID_KEY, MAP_LAYER_ID, true);

        const bottomLayer = createTileLayer(mapConfig);
        bottomLayer.set(LAYER_ID_KEY, MAP_LAYER_ID, true);

        // please note: the order of the layers within the array is relevant -
        // the shape layer needs to have a higher index than the map layer to be visible in the FE!
        return [bottomLayer, topLayer];
    }

    // default: create a single-layer map
    // please note: if both layers are null, the code will default to mapnik
    // tbd: we might could also throw an error instead, but would need to decide on error handling in the FE then
    const baseLayer =
        shapeLayer !== null
            ? createShapeFileLayer(mapConfig as ShapeMapConfig)
            : createTileLayer(mapConfig);
    baseLayer.set(LAYER_ID_KEY, MAP_LAYER_ID, true);
    return [baseLayer];
}

function createTileLayer(
    mapConfig: Pick<MapConfigWithOptLayout, "mapType">,
): BaseLayer {
    let {
        mapType: { mapLayer },
    } = mapConfig;

    if (mapLayer === null) {
        // please note: if the layer is null, the code will default to mapnik
        // tbd: we might could also throw an error instead, but would need to decide on error handling in the FE then
        mapLayer = TileServer.MAPNIK;
    }

    return new Tile({
        source: MAP_SOURCE.get(mapLayer)!(),
    });
}

export function isProjectionSupported(shapeFileData: ShapeFileData): boolean {
    try {
        const projection = new GeoJSON().readProjection(shapeFileData);
        return projection !== null;
    } catch {
        return false;
    }
}

function getProjectionCode(shapeFileData: ShapeFileData): string {
    const projection = new GeoJSON().readProjection(shapeFileData);
    if (projection === null) {
        throw new InputDataError(
            "Unsupported projection type. Please use geojson with pojection type 'EPSG:4326' or 'EPSG:3857' instead.",
        );
    }
    return projection.getCode();
}

export function createShapeFileLayer(
    mapConfig: NotNullishPick<ShapeMapConfig, "shapeFileData">,
): BaseLayer {
    const code = getProjectionCode(mapConfig.shapeFileData);
    const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(
            mapConfig.shapeFileData,
            code !== undefined
                ? { dataProjection: code, featureProjection: "EPSG:3857" }
                : { featureProjection: "EPSG:3857" },
        ),
    });

    const style = createVectorLayerStyle(mapConfig);

    const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: style,
    });
    return vectorLayer;
}

function createVectorLayerStyle(styleConfig: ShapeMapStyleConfig): StyleLike {
    return new Style({
        stroke: new Stroke({
            color: [
                styleConfig.lineColor.r,
                styleConfig.lineColor.g,
                styleConfig.lineColor.b,
            ],
            width: styleConfig.lineWidth,
        }),
    });
}

function getMapLayer(map: ol.Map): Array<BaseLayer> {
    return map
        .getLayers()
        .getArray()
        .filter((layer) => layer.get(LAYER_ID_KEY) === MAP_LAYER_ID);
}

export function updateVectorLayerStyle(
    map: ol.Map,
    styleConfig: ShapeMapStyleConfig,
): void {
    const mapLayers = getMapLayer(map);
    // loop through all layers
    mapLayers.forEach((layer) => {
        // apply styles only to instances of VectorLayer
        if (layer instanceof VectorLayer) {
            const style = createVectorLayerStyle(styleConfig);
            layer.setStyle(style);
        }
    });
}

export function updateMapType(
    map: ol.Map,
    mapConfig: MapConfigWithOptLayout,
): void {
    removeMapLayer(map);
    const layers = createMapLayer(mapConfig);
    layers.forEach((layer, index) => {
        map.getLayers().insertAt(index, layer);
    });
}

function removeMapLayer(map: ol.Map) {
    const mapLayers = getMapLayer(map);
    // loop through all layers
    mapLayers.forEach((mapLayer) => {
        // remove each one from map
        map.removeLayer(mapLayer);
    });
}
