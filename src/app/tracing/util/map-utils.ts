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
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
// import { Tile } from "ol/layer";
import VectorSource from "ol/source/Vector";
import { GeoJSON } from "ol/format";
import { Stroke, Style } from "ol/style";
import { InputDataError } from "../io/io-errors";
import { StyleLike } from "ol/style/Style";
import { NotNullish } from "./utility-types";
import * as _ from "lodash";

export interface RectConfig {
    left: number;
    right: number;
    top: number;
    bottom: number;
    borderWidth: number;
}

const MAP_SOURCE: Map<TileServer, () => OSM> = new Map([
    [TileServer.MAPNIK, () => new OSM()],
    // the following code is commented because
    // the Black & White Map might be deactivatd only temporarily
    // [TileServer.BLACK_AND_WHITE, () => new OSM({
    //     url: 'https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png',
    //     crossOrigin: null
    // })]
]);

const LAYER_VISIBILITY: Record<
    MapType,
    Partial<{ showTiles: boolean; showShape: boolean }>
> = {
    [MapType.TILES_ONLY]: { showTiles: true },
    [MapType.TILES_AND_SHAPE]: { showTiles: true, showShape: true },
    [MapType.SHAPE_ONLY]: { showShape: true },
};

export function createOpenLayerMap(
    mapConfig: MapViewConfig,
    target?: HTMLElement,
): ol.Map {
    const map = new ol.Map({
        target: target,
        layers: createMapLayers(mapConfig),
        controls: [],
    });
    return map;
}

export function createMapLayers(mapConfig: MapViewConfig): Array<BaseLayer> {
    const layers: BaseLayer[] = [];
    if (LAYER_VISIBILITY[mapConfig.mapType].showTiles) {
        layers.push(createTileLayer(mapConfig));
    }
    if (LAYER_VISIBILITY[mapConfig.mapType].showShape) {
        const shapeLayer = createShapeFileLayer(
            mapConfig as NotNullish<ShapeFileSettings>,
        );
        layers.push(shapeLayer);
    }

    return layers;
}

function createTileLayer(
    mapConfig: Pick<MapSettings, "tileServer">,
): TileLayer {
    const { tileServer } = mapConfig;

    return new TileLayer({
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
): VectorLayer {
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

function isVectorLayer(layer: BaseLayer): layer is VectorLayer {
    return layer instanceof VectorLayer;
}

function isTileLayer(layer: BaseLayer): layer is TileLayer {
    return layer instanceof TileLayer;
}

function getMapLayers<T extends BaseLayer>(
    map: ol.Map,
    layerTypePredicate: (layer: BaseLayer) => layer is T,
): Array<T> {
    return map.getLayers().getArray().filter(layerTypePredicate);
}

export function updateVectorLayerStyle(
    map: ol.Map,
    styleConfig: ShapeFileSettings,
): void {
    const vectorLayers = getMapLayers(map, isVectorLayer);

    vectorLayers.forEach((layer) => {
        const style = createVectorLayerStyle(styleConfig);
        layer.setStyle(style);
    });
}

export const insertLayer = (map: ol.Map, layer: BaseLayer) => {
    // make sure, shape layer is always the last element in the array,
    // so user can see the shape layer on top of the map layer when both layers are visible
    const mapLayers = map.getLayers();
    const index = layer instanceof VectorLayer ? mapLayers.getLength() : 0;
    mapLayers.insertAt(index, layer);
};

function setLayersVisibility(layers: Array<BaseLayer>, visible: boolean): void {
    layers.forEach((layer) => layer.setVisible(visible));
}

function updateTileLayer(
    map: ol.Map,
    newMapConfig: MapViewConfig,
    oldMapConfig: MapViewConfig,
): void {
    let tileLayers = getMapLayers(map, isTileLayer);
    if (newMapConfig.tileServer !== oldMapConfig.tileServer) {
        tileLayers.forEach((layer) => map.removeLayer(layer));
        tileLayers = [];
    }
    if (LAYER_VISIBILITY[newMapConfig.mapType].showTiles) {
        if (tileLayers.length === 0) {
            insertLayer(map, createTileLayer(newMapConfig));
        } else {
            setLayersVisibility(tileLayers, true);
        }
    } else {
        setLayersVisibility(tileLayers, false);
    }
}

function wasStyleChanged(
    newStyle: ShapeStyleSettings,
    oldStyle: ShapeStyleSettings,
): boolean {
    return (
        newStyle.geojsonBorderColor !== oldStyle.geojsonBorderColor ||
        newStyle.geojsonBorderWidth !== oldStyle.geojsonBorderWidth
    );
}

function updateShapeLayer(
    map: ol.Map,
    newMapConfig: MapViewConfig,
    oldMapConfig: MapViewConfig,
): void {
    let shapeLayers = getMapLayers(map, isVectorLayer);
    if (newMapConfig.shapeFileData !== oldMapConfig.shapeFileData) {
        shapeLayers.forEach((layer) => map.removeLayer(layer));
        shapeLayers = [];
    }
    if (LAYER_VISIBILITY[newMapConfig.mapType].showShape) {
        if (shapeLayers.length === 0) {
            insertLayer(
                map,
                createShapeFileLayer(
                    newMapConfig as NotNullish<ShapeFileSettings>,
                ),
            );
        } else {
            if (wasStyleChanged(newMapConfig, oldMapConfig)) {
                updateVectorLayerStyle(map, newMapConfig);
            }
            setLayersVisibility(shapeLayers, true);
        }
    } else {
        setLayersVisibility(shapeLayers, false);
        if (wasStyleChanged(newMapConfig, oldMapConfig)) {
            updateVectorLayerStyle(map, newMapConfig);
        }
    }
}

export function updateMapLayers(
    map: ol.Map,
    newMapConfig: MapViewConfig,
    oldMapConfig: MapViewConfig,
): void {
    updateTileLayer(map, newMapConfig, oldMapConfig);
    updateShapeLayer(map, newMapConfig, oldMapConfig);
}
