import { Component, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as ol from 'ol';
import { Utils as UIUtils } from '../../../util/ui-utils';
import {
    Layout,
    MapType,
    ShapeFileData, Size
} from '../../../data.model';
import _ from 'lodash';
import { createOpenLayerMap, removeFrameLayer, setFrameLayer, updateMapType } from '@app/tracing/util/map-utils';
import { BoundaryRect } from '@app/tracing/util/geometry-utils';

export interface MapConfig {
    layout: Layout | null;
    mapType: MapType;
    shapeFileData: ShapeFileData | null;
}

export type UnknownPosFrameData = BoundaryRect;

@Component({
    selector: 'fcl-geomap',
    templateUrl: './geomap.component.html',
    styleUrls: ['./geomap.component.scss']
})
export class GeoMapComponent implements OnChanges {

    @ViewChild('map', { static: true }) mapElement: ElementRef;

    @Input() mapConfig: MapConfig;
    @Input() frameData: BoundaryRect | null = null;

    private map: ol.Map | null = null;
    private processedFrameData: BoundaryRect | null = null;

    constructor(public elementRef: ElementRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes.mapConfig !== undefined) {
            this.checkAndUpdateMap(changes.mapConfig.currentValue, changes.mapConfig.previousValue);
        }
        if (changes.frameData !== undefined) {
            this.checkFrameData(changes.frameData.currentValue);
        }
    }

    onComponentResized(): void {
        if (this.map !== null && this.isSizePositive()) {
            this.resizeMap();
        }
    }

    private isSizePositive(): boolean {
        const size = this.getSize();
        return size.width > 0 && size.height > 0;
    }

    private getSize(): Size {
        const size: Size = this.elementRef.nativeElement.getBoundingClientRect();
        return {
            width: size.width,
            height: size.height
        };
    }

    private initMap(mapConfig: MapConfig): void {
        this.map = createOpenLayerMap(mapConfig, this.mapElement.nativeElement);
        this.updateMap(mapConfig);
    }

    private updateMapType(mapConfig: MapConfig): void {
        updateMapType(this.map, mapConfig);
    }

    private updateMap(mapConfig: MapConfig) {
        if (mapConfig.layout !== null) {
            const size = this.getSize();
            this.map.setView(UIUtils.panZoomToView(
                this.mapConfig.layout.pan,
                this.mapConfig.layout.zoom,
                size.width, size.height
            ));
        }
    }

    private resizeMap() {
        if (this.map !== null) {
            this.map.updateSize();
            this.updateMap(this.mapConfig);
        }
    }

    private addFrameLayer(frameData: BoundaryRect) {
        const olCoordTopLeft = UIUtils.positionToOlCoords(
            frameData.left, frameData.top, 1
        );
        const olCoordBottomRight = UIUtils.positionToOlCoords(
            frameData.right, frameData.bottom, 1
        );
        setFrameLayer(this.map, {
            xMin: olCoordTopLeft.x,
            yMin: olCoordTopLeft.y,
            xMax: olCoordBottomRight.x,
            yMax: olCoordBottomRight.y
        });
    }

    private removeFrameLayer() {
        removeFrameLayer(this.map);
    }

    private checkAndUpdateMap(newMapConfig: MapConfig, oldMapConfig: MapConfig | undefined): void {
        if (newMapConfig.layout !== null) {
            if (this.map === null) {
                this.initMap(newMapConfig);
                this.checkFrameData(this.frameData);
            } else if (oldMapConfig !== newMapConfig) {
                if (
                    newMapConfig.mapType !== oldMapConfig.mapType ||
                    newMapConfig.shapeFileData !== oldMapConfig.shapeFileData
                ) {
                    this.updateMapType(newMapConfig);
                }
                if (newMapConfig.layout !== oldMapConfig.layout) {
                    this.updateMap(newMapConfig);
                }
            }
        }
    }

    private checkFrameData(newFrameData: BoundaryRect | null): void {
        if (this.map !== null && newFrameData !== this.processedFrameData) {
            if (this.processedFrameData) {
                this.removeFrameLayer();
            }
            if (this.frameData) {
                this.addFrameLayer(newFrameData);
            }
            this.processedFrameData = newFrameData;
        }
    }
}
