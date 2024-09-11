import { MapConfig, MapType, ShapeFileData } from "../data.model";
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

const MAP_SOURCE: Map<MapType, () => OSM> = new Map([
    [MapType.MAPNIK, () => new OSM()],
    // the following code is commented because
    // the Black & White Map might be deactivatd only temporaryly
    // ,
    // [MapType.BLACK_AND_WHITE, () => new OSM({
    //     url: 'https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
    //     crossOrigin: null
    // })]
]);

// the following code is commented because
// the Black & White Map might be deactivatd only temporaryly
// const availableMapTypes: MapType[] = [ MapType.MAPNIK, MapType.BLACK_AND_WHITE ];
const availableMapTypes: MapType[] = [MapType.MAPNIK];

export function getAvailableMapTypes(): MapType[] {
    return availableMapTypes;
}

export function createOpenLayerMap(
    mapConfig: MapConfigWithOptLayout,
    target?: HTMLElement,
): ol.Map {
    const map = new ol.Map({
        target: target,
        layers: [createMapLayer(mapConfig)],
        controls: [],
    });
    return map;
}

function createMapLayer(mapConfig: MapConfigWithOptLayout): BaseLayer {
    const baseLayer =
        mapConfig.mapType !== MapType.SHAPE_FILE
            ? createTileLayer(mapConfig)
            : createShapeFileLayer(mapConfig as ShapeMapConfig);
    baseLayer.set(LAYER_ID_KEY, MAP_LAYER_ID, true);
    return baseLayer;
}

function createTileLayer(
    mapConfig: Pick<MapConfigWithOptLayout, "mapType">,
): BaseLayer {
    return new Tile({
        source: MAP_SOURCE.get(mapConfig.mapType)!(),
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

function getMapLayer(map: ol.Map): BaseLayer | null {
    const layers = map
        .getLayers()
        .getArray()
        .filter((layer) => layer.get(LAYER_ID_KEY) === MAP_LAYER_ID);
    return layers.length > 0 ? layers[0] : null;
}

export function updateVectorLayerStyle(
    map: ol.Map,
    styleConfig: ShapeMapStyleConfig,
): void {
    const vectorLayer = getMapLayer(map);
    if (vectorLayer instanceof VectorLayer) {
        const style = createVectorLayerStyle(styleConfig);
        vectorLayer.setStyle(style);
    }
}

export function updateMapType(
    map: ol.Map,
    mapConfig: MapConfigWithOptLayout,
): void {
    removeMapLayer(map);
    map.getLayers().insertAt(0, createMapLayer(mapConfig));
}

function removeMapLayer(map: ol.Map) {
    const mapLayer = getMapLayer(map);
    if (mapLayer !== null) {
        map.removeLayer(mapLayer);
    }
}
