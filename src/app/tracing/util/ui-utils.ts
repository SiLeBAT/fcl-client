import {
    DialogAlignment, Position
} from '../data.model';
import { DialogPosition, MatMenuTrigger } from '@angular/material';
import * as ol from 'ol';
import { fromLonLat } from 'ol/proj';
import { ElementRef } from '@angular/core';

export class Utils {
    private static CY_TO_OL_FACTOR = 10000;

    static latLonToPosition(lat: number, lon: number, zoom: number): Position {
        const p = fromLonLat([lon, lat]);

        return {
            x: (p[0] / Utils.CY_TO_OL_FACTOR) * zoom,
            y: (-p[1] / Utils.CY_TO_OL_FACTOR) * zoom
        };
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

    static getDialogPosition(alignment: DialogAlignment): DialogPosition {
        switch (alignment) {
            case DialogAlignment.LEFT:
                return { left: '0px' };
            case DialogAlignment.CENTER:
                return {};
            case DialogAlignment.RIGHT:
                return { right: '0px' };
        }

        return null;
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

    static openMenu(trigger: MatMenuTrigger, triggerElement: ElementRef, pos: Position) {
        const style = (triggerElement.nativeElement as HTMLElement).style;

        style.position = 'fixed';
        style.left = pos.x + 'px';
        style.top = pos.y + 'px';
        trigger.openMenu();
    }
}
