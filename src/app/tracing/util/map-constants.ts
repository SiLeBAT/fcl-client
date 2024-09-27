import { MapType, TileServer } from "../data.model";
import { COLORS } from "./colors";

export const MAP_CONSTANTS = {
    types: [
        MapType.MAP_ONLY,
        MapType.SHAPE_ONLY,
        MapType.TILES_AND_SHAPE,
    ] as Array<MapType>, // please note: the order is relevant!
    tiles: [
        TileServer.MAPNIK /*TileServer.BLACK_AND_WHITE*/,
    ] as Array<TileServer>,
    labels: {
        [TileServer.MAPNIK]: "Mapnik",
        [MapType.SHAPE_ONLY]: "Shape File",
        [MapType.TILES_AND_SHAPE]: "Map & Shape File",
        //temporarily deactivated, therefore just a comment and not removed
        //[TileServer.BLACK_AND_WHITE]: "Black & White",
    } as Record<TileServer | MapType, string>,
    defaults: {
        mapType: MapType.MAP_ONLY,
        tileServer: TileServer.MAPNIK,
        geoJSON_border_width: 0.5,
        geoJSON_border_color: COLORS.primary_dark,
    },
};
