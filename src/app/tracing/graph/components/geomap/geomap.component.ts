import { Component, ElementRef, ViewChild, Input, ChangeDetectionStrategy, OnChanges } from '@angular/core';
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
    styleUrls: ['./geomap.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeoMapComponent implements OnChanges {

    @ViewChild('map', { static: true }) mapElement: ElementRef;

    @Input() mapConfig: MapConfig;
    @Input() frameData: BoundaryRect;

    private map: ol.Map = null;
    private processedMapConfig: MapConfig = null;
    private processedFrameData: BoundaryRect = null;

    constructor(public elementRef: ElementRef) {}

    ngOnChanges(): void {
        this.checkAndUpdateMap();
        this.checkFrameData();
    }

    onComponentResized(): void {
        if (this.mapConfig && this.isSizePositive()) {
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

    private initMap(): void {
        this.map = createOpenLayerMap(this.mapConfig, this.mapElement.nativeElement);
        this.updateMap();
    }

    private updateMapType(): void {
        updateMapType(this.map, this.mapConfig);
    }

    private updateMap() {
        if (this.mapConfig.layout !== null) {
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
            this.updateMap();
        }
    }

    private addFrameLayer() {
        const olCoordTopLeft = UIUtils.positionToOlCoords(
            this.frameData.left, this.frameData.top, 1
        );
        const olCoordBottomRight = UIUtils.positionToOlCoords(
            this.frameData.right, this.frameData.bottom, 1
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

    private checkAndUpdateMap(): void {
        if (this.mapConfig !== undefined && this.mapConfig.layout !== null) {
            const oldMapConfig = this.processedMapConfig;
            const newMapConfig = this.mapConfig;
            if (this.map === null) {
                this.initMap();
            } else if (oldMapConfig !== newMapConfig) {
                if (
                    newMapConfig.mapType !== oldMapConfig.mapType ||
                    newMapConfig.shapeFileData !== oldMapConfig.shapeFileData
                ) {
                    this.updateMapType();
                }
                if (newMapConfig.layout !== oldMapConfig.layout) {
                    this.updateMap();
                }
            }
            this.processedMapConfig = newMapConfig;
        }
    }

    private checkFrameData(): void {
        if (this.map !== null && this.frameData !== this.processedFrameData) {
            if (this.processedFrameData) {
                this.removeFrameLayer();
            }
            if (this.frameData) {
                this.addFrameLayer();
            }
            this.processedFrameData = this.frameData;
        }
    }
}
