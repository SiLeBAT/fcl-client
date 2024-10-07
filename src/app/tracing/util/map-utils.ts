import {
    MapType,
    TileServer,
    ShapeFileData,
    MapViewConfig,
    ShapeFileSettings,
    ShapeStyleSettings,
    MapSettings,
} from "../data.model";
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
import { NotNullish } from "./utility-types";
import TileLayer from "ol/layer/Tile";
import { indexOf } from "lodash";

export interface RectConfig {
    left: number;
    right: number;
    top: number;
    bottom: number;
    borderWidth: number;
}

const LAYER_ID_KEY = "layerId";
const TILE_LAYER_ID = "TileLayer";
const SHAPE_LAYER_ID = "ShapeLayer";

const MAP_SOURCE: Map<TileServer, () => OSM> = new Map([
    [TileServer.MAPNIK, () => new OSM()],
    // the following code is commented because
    // the Black & White Map might be deactivatd only temporarily
    // [TileServer.BLACK_AND_WHITE, () => new OSM({
    //     url: 'https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
    //     crossOrigin: null
    // })]
]);

export function createOpenLayerMap(
    mapConfig: MapViewConfig,
    target?: HTMLElement,
): ol.Map {
    const map = new ol.Map({
        target: target,
        layers: createMapLayer(mapConfig),
        controls: [],
    });
    return map;
}

function createMapLayer(mapConfig: MapViewConfig): Array<BaseLayer> {
    const { mapType } = mapConfig;
    if (mapType === MapType.SHAPE_ONLY) {
        const baseLayer = createShapeFileLayer(
            mapConfig as NotNullish<ShapeFileSettings>,
        );
        baseLayer.set(LAYER_ID_KEY, SHAPE_LAYER_ID, true);
        return [baseLayer];
    }

    const baseLayer = createTileLayer(mapConfig);
    baseLayer.set(LAYER_ID_KEY, TILE_LAYER_ID, true);
    return [baseLayer];
}

function createTileLayer(
    mapConfig: Pick<MapSettings, "tileServer">,
): BaseLayer {
    console.log("creating tile layer");
    const { tileServer } = mapConfig;

    return new Tile({
        source: MAP_SOURCE.get(tileServer)!(),
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
    mapConfig: NotNullish<ShapeFileSettings>,
): BaseLayer {
    console.log("creating shape file");
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

function createVectorLayerStyle(styleConfig: ShapeStyleSettings): StyleLike {
    console.log("creating shape style");
    return new Style({
        stroke: new Stroke({
            color: [
                styleConfig.geojsonBorderColor.r,
                styleConfig.geojsonBorderColor.g,
                styleConfig.geojsonBorderColor.b,
            ],
            width: styleConfig.geojsonBorderWidth,
        }),
    });
}

function getMapLayer(map: ol.Map, layerType): Array<BaseLayer> {
    console.log("getMapLayer");
    return map
        .getLayers()
        .getArray()
        .filter((layer) => layer instanceof layerType);
}

export function updateVectorLayerStyle(
    map: ol.Map,
    styleConfig: ShapeFileSettings,
): void {
    const mapLayers = getMapLayer(map, VectorLayer);
    // loop through all layers
    mapLayers.forEach((layer) => {
        // apply styles only to instances of VectorLayer
        if (layer instanceof VectorLayer) {
            const style = createVectorLayerStyle(styleConfig);
            layer.setStyle(style);
        }
    });
}

export const setLayerVisibility = (
    layer: BaseLayer,
    visibility: boolean,
    callback,
): void => {
    const layerExisits = layer !== undefined && layer.setVisible !== undefined;
    // if layer does not exist and should not be visible, do nothing
    if (!layerExisits && !visibility) {
        return;
    }

    // if layer does not exist but should be visible, let callback handle creation of layer
    if (!layerExisits && visibility) {
        callback();
        return;
    }

    // if visibility setting is already correct, do nothing
    if (layer.getVisible() === visibility) {
        return;
    }

    // if layer exists, toggle visibility
    layer.setVisible(visibility);
};

export const insertLayer = (map: ol.Map, layer: BaseLayer) => {
    // make sure, shape layer is always the last element in the array,
    // so user can see the shape layer on top of the map layer when both layers are visible
    const mapLayers = map.getLayers();
    const index = layer instanceof VectorLayer ? mapLayers.getLength() : 0;
    mapLayers.insertAt(index, layer);
    console.log(mapLayers);
};

export function updateMapType(map: ol.Map, mapConfig: MapViewConfig): void {
    const tileLayer = getMapLayer(map, TileLayer);
    const shapeLayer = getMapLayer(map, VectorLayer);
    const { mapType } = mapConfig;
    const createMapCallback = () => {
        const newLayer = createMapLayer(mapConfig);
        insertLayer(map, newLayer[0]);
    };

    switch (mapType) {
        case MapType.TILES_ONLY:
            // hide shape
            setLayerVisibility(shapeLayer[0], false, createMapCallback);
            // show tile
            setLayerVisibility(tileLayer[0], true, createMapCallback);
            break;
        case MapType.SHAPE_ONLY:
            // hide tile
            setLayerVisibility(tileLayer[0], false, createMapCallback);
            // show shape
            setLayerVisibility(shapeLayer[0], true, createMapCallback);
            break;
        case MapType.TILES_AND_SHAPE:
            // show shape --> option only available, if shape file present
            // so no additional checks necessary
            setLayerVisibility(shapeLayer[0], true, createMapCallback);
            console.log(map.getLayers().getArray());
            // show tile
            setLayerVisibility(tileLayer[0], true, createMapCallback);
            break;
        default:
            throw new Error(
                `MapType ${mapType} is not currently supported. Please review code or add MapType. This error should never occur in production. You are most likely seeing this, because you have changed the code.`,
            );
    }
}

function removeMapLayer(map: ol.Map, layerID) {
    const mapLayers = getMapLayer(map, layerID);
    console.log(mapLayers);
    // loop through all layers
    mapLayers.forEach((mapLayer) => {
        // remove each one from map
        map.removeLayer(mapLayer);
    });
}
