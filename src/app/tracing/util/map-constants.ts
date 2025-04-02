import { MapType, TileServer } from "../data.model";
import { COLORS, RGBA_COLORS } from "./colors";

export const MAP_CONSTANTS = {
    types: [
        MapType.TILES_ONLY,
        MapType.SHAPE_ONLY,
        MapType.TILES_AND_SHAPE,
    ] as Array<MapType>, // please note: array - so order is relevant!
    tiles: [
        TileServer.MAPNIK,
        //TileServer.BLACK_AND_WHITE,
    ] as Array<TileServer>, // please note: array - so order is relevant!
    tileServerLabels: {
        [TileServer.MAPNIK]: "Mapnik",
        //temporarily deactivated, therefore just a comment and not removed
        //[TileServer.BLACK_AND_WHITE]: "Black & White",
    } as Record<TileServer, string>,
    mapTypeLabels: {
        [MapType.SHAPE_ONLY]: "Shape File",
        [MapType.TILES_AND_SHAPE]: "Map & Shape File",
    } as Record<MapType, string>,
    defaults: {
        mapType: MapType.TILES_ONLY,
        tileServer: TileServer.MAPNIK,
        // geojsonBorderWidth: 3,
        // geojsonBorderColor: COLORS.shapeBorderGrey,
        // geojsonFillColor: RGBA_COLORS.shapeFillColor,
        shapeStyle: {
            borderWidth: 3,
            borderColor: COLORS.shapeBorderGrey,
            fillColor: undefined,
        },
    },
};
