import { MapType, TileServer } from "../data.model";
import { COLORS } from "./colors";



export class MapConstants {
    static readonly TYPES:Array<MapType> = [ MapType.MAP_ONLY, MapType.SHAPE_ONLY, MapType.TILES_AND_SHAPE];
    static readonly LABELS = {
        [MapType.MAP_ONLY]: {
            [TileServer.MAPNIK]: 'Mapnik',
            //temporarily deactivated, therefore just a comment and not removed
            //[TileServer.BLACK_AND_WHITE]: "Black & White",
        },
        [MapType.SHAPE_ONLY]: "Shape File",
        [MapType.TILES_AND_SHAPE]: "Map & Shape File",
    };

    static readonly DEFAULTS = {
        mapType: MapType.MAP_ONLY,
        tileServer: TileServer.MAPNIK,
        geoJSON_border_width: 0.5,
        geoJSON_border_color: COLORS.primary_dark,
    } 

    getLabel(mapType, tileServer?):string|null {
        if(mapType === MapType.MAP_ONLY && tileServer === undefined) {
            return null;
        }

        if (mapType === MapType.MAP_ONLY) {
            return MapConstants.LABELS[mapType][tileServer];
        }

        return MapConstants.LABELS[mapType];
    }
}