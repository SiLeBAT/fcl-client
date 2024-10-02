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

    // create a multi-layer map if both layers are present
    if (mapType === MapType.TILES_AND_SHAPE) {
        const topLayer = createShapeFileLayer(
            mapConfig as NotNullish<ShapeFileSettings>,
        );
        topLayer.set(LAYER_ID_KEY, SHAPE_LAYER_ID, true);

        const bottomLayer = createTileLayer(mapConfig);
        bottomLayer.set(LAYER_ID_KEY, TILE_LAYER_ID, true);

        // please note: the order of the layers within the array is relevant -
        // the shape layer needs to have a higher index than the map layer to be visible in the FE!
        return [bottomLayer, topLayer];
    }

    // default: create a single-layer map
    if(mapType === MapType.SHAPE_ONLY) {
        const baseLayer = createShapeFileLayer(mapConfig as NotNullish<ShapeFileSettings>)
        baseLayer.set(LAYER_ID_KEY, SHAPE_LAYER_ID, true);
        return [baseLayer];
    }

    const baseLayer = createTileLayer(mapConfig)
    baseLayer.set(LAYER_ID_KEY, TILE_LAYER_ID, true);
    return [baseLayer];
}

function createTileLayer(
    mapConfig: Pick<MapSettings, "tileServer">,
): BaseLayer {
    console.log('creating tile layer')
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
    console.log('creating shape file')
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
    console.log('creating shape style')
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
    console.log('getMapLayer')
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

export const setLayerVisibility = (layer:BaseLayer, visibility:boolean):void => {
    if (layer === undefined || layer.setVisible === undefined) {
        return;
    }

    layer.setVisible(visibility);
}

export const insertLayer = (map:ol.Map, layer:BaseLayer) => {
    const mapLayers = map.getLayers();
    const index = layer instanceof VectorLayer? mapLayers.getLength() : 0;
    console.log(mapLayers.getLength(), mapLayers.getArray(), index, layer)
    mapLayers.insertAt(index, layer);
    console.log(mapLayers)
}

export function updateMapType(map: ol.Map, mapConfig: MapViewConfig): void {
    //removeMapLayer(map, );
    let tileLayer = getMapLayer(map, TileLayer);
    let shapeLayer = getMapLayer(map, VectorLayer);
    const layers:BaseLayer[] = [];

    switch(mapConfig.mapType) {
        case MapType.TILES_ONLY: 
            // hide shape
            setLayerVisibility(shapeLayer[0], false);
            // show or create tile
            tileLayer.length === 0 ? 
            insertLayer(map, createTileLayer(mapConfig)) :
            setLayerVisibility(tileLayer[0], true);
            break;
        case MapType.SHAPE_ONLY: 
            // hide tile
            setLayerVisibility(tileLayer[0], false);
            // show or create shape
            shapeLayer.length === 0 ? 
            insertLayer(map, createShapeFileLayer(mapConfig as NotNullish<ShapeFileSettings>)) :
            setLayerVisibility(shapeLayer[0], true);
            break;
        case MapType.TILES_AND_SHAPE:
            // show or create tile
            tileLayer.length === 0 ? 
            insertLayer(map, createTileLayer(mapConfig)) :
            setLayerVisibility(tileLayer[0], true);
            // show or create shape
            shapeLayer.length === 0 ? 
            insertLayer(map, createShapeFileLayer(mapConfig as NotNullish<ShapeFileSettings>)) :
            setLayerVisibility(shapeLayer[0], true);
            break;
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
