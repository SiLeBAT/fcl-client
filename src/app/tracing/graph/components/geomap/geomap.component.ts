import {
    Component,
    ElementRef,
    ViewChild,
    Input,
    OnChanges,
    SimpleChanges,
    SimpleChange,
} from "@angular/core";
import * as ol from "ol";
import { Utils as UIUtils } from "../../../util/ui-utils";
import { MapType, Size, MapConfig } from "../../../data.model";
import {
    createOpenLayerMap,
    updateMapType,
    updateVectorLayerStyle,
} from "@app/tracing/util/map-utils";

interface TypedSimpleChange<T> extends SimpleChange {
    currentValue: T;
    previousValue: T | undefined;
}

@Component({
    selector: "fcl-geomap",
    templateUrl: "./geomap.component.html",
    styleUrls: ["./geomap.component.scss"],
})
export class GeoMapComponent implements OnChanges {
    @ViewChild("map", { static: true }) mapElement: ElementRef;

    @Input() mapConfig: MapConfig;

    private map: ol.Map | null = null;

    constructor(public elementRef: ElementRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        this.processInputChanges(changes.mapConfig);
    }

    onComponentResized(): void {
        if (this.map !== null && this.isSizePositive()) {
            this.resizeMap();
        }
    }

    private processInputChanges(
        mapConfigChange: TypedSimpleChange<MapConfig> | undefined,
    ): void {
        if (
            mapConfigChange !== undefined &&
            mapConfigChange.currentValue.layout !== null
        ) {
            if (this.map === null) {
                this.initMap(mapConfigChange.currentValue);
            } else {
                this.updateMap(
                    mapConfigChange.currentValue,
                    mapConfigChange.previousValue!,
                );
            }
        }
    }

    private isSizePositive(): boolean {
        const size = this.getSize();
        return size.width > 0 && size.height > 0;
    }

    private getSize(): Size {
        const size: Size =
            this.elementRef.nativeElement.getBoundingClientRect();
        return {
            width: size.width,
            height: size.height,
        };
    }

    private initMap(mapConfig: MapConfig): void {
        this.map = createOpenLayerMap(mapConfig, this.mapElement.nativeElement);
        this.updateMapView(mapConfig);
    }

    private updateMapType(mapConfig: MapConfig): void {
        updateMapType(this.map!, mapConfig);
    }

    private updateMapView(mapConfig: MapConfig) {
        if (mapConfig.layout !== null) {
            const size = this.getSize();
            this.map!.setView(
                UIUtils.panZoomToView(
                    mapConfig.layout.pan,
                    mapConfig.layout.zoom,
                    size.width,
                    size.height,
                ),
            );
        }
    }

    private resizeMap() {
        if (this.map !== null) {
            this.map.updateSize();
            this.updateMapView(this.mapConfig);
        }
    }

    private updateMap(newMapConfig: MapConfig, oldMapConfig: MapConfig): void {
        const shapeOrTileHasChanged =
            newMapConfig.mapType !== oldMapConfig.mapType ||
            newMapConfig.tileServer !== oldMapConfig.tileServer ||
            newMapConfig.shapeFileData !== oldMapConfig.shapeFileData;
        const shapeStyleHasChanged =
            newMapConfig.mapType !== MapType.MAP_ONLY &&
            (newMapConfig.lineColor !== oldMapConfig.lineColor ||
                newMapConfig.lineWidth !== oldMapConfig.lineWidth);
        const layoutHasChanged = newMapConfig.layout !== oldMapConfig.layout;

        if (
            !shapeOrTileHasChanged &&
            !shapeStyleHasChanged &&
            !layoutHasChanged
        ) {
            // no changes, so early return
            return;
        }

        if (shapeOrTileHasChanged) {
            // changes to map type, shape file data or tile server, so trigger maptype updates and leave function
            this.updateMapType(newMapConfig);
            return;
        }

        if (shapeStyleHasChanged) {
            // changes to shape styles, so trigger vector style updates and leave function
            updateVectorLayerStyle(this.map!, newMapConfig);
            return;
        }

        // changes to layout, so trigger view updates and leave function
        this.updateMapView(newMapConfig);
    }
}
