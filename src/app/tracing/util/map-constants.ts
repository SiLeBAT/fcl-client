import { MapType, TileServer } from "../data.model";
import { COLORS } from "./colors";

export const MAP_CONSTANTS = {
    types: [
        MapType.TILES_ONLY,
        MapType.SHAPE_ONLY,
        MapType.TILES_AND_SHAPE,
    ] as Array<MapType>, // please note: array - so order is relevant!
    tiles: [
        TileServer.MAPNIK /*TileServer.BLACK_AND_WHITE*/,
    ] as Array<TileServer>, // please note: array - so order is relevant!
    labels: {
        [TileServer.MAPNIK]: "Mapnik",
        [MapType.SHAPE_ONLY]: "Shape File",
        [MapType.TILES_AND_SHAPE]: "Map & Shape File",
        //temporarily deactivated, therefore just a comment and not removed
        //[TileServer.BLACK_AND_WHITE]: "Black & White",
    } as Record<TileServer | MapType, string>,
    defaults: {
        mapType: MapType.TILES_ONLY,
        tileServer: TileServer.MAPNIK,
        geojsonBorderWidth: 0.5,
        geojsonBorderColor: COLORS.primary_dark,
    },
};
