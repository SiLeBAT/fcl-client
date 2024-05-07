import { StationData } from './../data.model';
import { Position } from '../data.model';
import { MatLegacyMenuTrigger as MatMenuTrigger } from '@angular/material/legacy-menu';
import * as ol from 'ol';
import { fromLonLat, toLonLat } from 'ol/proj';
import { ElementRef } from '@angular/core';
import { RequiredPick } from './utility-types';

export class Utils {
    private static CY_TO_OL_FACTOR = 10000;

    static olCoordsTolatLon(lat: number, lon: number) {
        return toLonLat([lon, lat]);
    }

    static latLonToOlCoords(lat: number, lon: number) {
        return fromLonLat([lon, lat]);
    }

    static olCoordsToPosition(x: number, y: number, zoom: number): Position {
        return {
            x: (x / Utils.CY_TO_OL_FACTOR) * zoom,
            y: (-y / Utils.CY_TO_OL_FACTOR) * zoom
        };
    }

    static positionToOlCoords(x: number, y: number, zoom: number): Position {
        return {
            x: (x * Utils.CY_TO_OL_FACTOR) / zoom,
            y: (-y * Utils.CY_TO_OL_FACTOR) / zoom
        };
    }

    static latLonToPosition(lat: number, lon: number, zoom: number): Position {
        const p = Utils.latLonToOlCoords(lat, lon);

        return Utils.olCoordsToPosition(p[0], p[1], zoom);

    }

    static panZoomToView(pan: Position, zoom: number, width: number, height: number): ol.View {
        return new ol.View({
            center: [
                ((width / 2 - pan.x) / zoom) * Utils.CY_TO_OL_FACTOR,
                (-(height / 2 - pan.y) / zoom) * Utils.CY_TO_OL_FACTOR
            ],
            resolution: Utils.CY_TO_OL_FACTOR / zoom
        });
    }

    static openSaveDialog(url: string, fileName: string) {
        const a = document.createElement('a');

        a.style.display = 'none';
        a.target = '_blank';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    static openSaveBlobDialog(blob: any, fileName: string) {
        const a = document.createElement('a');

        const url = window.URL.createObjectURL(blob);
        a.style.display = 'none';
        a.target = '_blank';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }

    static openMenu(trigger: MatMenuTrigger, triggerElement: ElementRef, pos: Position) {
        const style = (triggerElement.nativeElement as HTMLElement).style;

        style.position = 'fixed';
        style.left = pos.x + 'px';
        style.top = pos.y + 'px';
        trigger.openMenu();
    }

    static hasVisibleStationsWithGisInfo(stations: StationData[]): boolean {
        const stationsWithGis = stations
            .filter((station: StationData) => !station.invisible)
            .filter((station: StationData) => Utils.hasGisInfo(station));

        return stationsWithGis.length > 0;
    }


    static hasGisInfo(x: StationData): x is RequiredPick<StationData, 'lat' | 'lon'> {
        return (
            x.lat !== undefined && x.lat !== null &&
            x.lon !== undefined && x.lon !== null
        );
    }
}
