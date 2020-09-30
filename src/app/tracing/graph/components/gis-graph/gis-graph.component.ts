import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import html2canvas from 'html2canvas';
import {
    Layout, GraphState, GraphType, LegendInfo, MergeDeliveriesType, MapType,
    ShapeFileData
} from '../../../data.model';
import _ from 'lodash';
import { Action, Store } from '@ngrx/store';
import { ContextMenuRequestInfo, GraphServiceData, SelectedGraphElements } from '../../graph.model';
import { GraphService } from '../../graph.service';
import { AlertService } from '@app/shared/services/alert.service';
import { filter } from 'rxjs/operators';
import { GraphDataChange } from '../graph-view/graph-view.component';
import { GraphData } from '../graph-view/cy-graph';
import { mapGraphSelectionToFclElementSelection } from '../../graph-utils';
import { StyleConfig } from '../graph-view/cy-style';
import { MapConfig, UnknownPosFrameData } from '../geomap/geomap.component';
import { GisPositioningService } from '../../gis-positioning.service';
import { ContextMenuViewComponent } from '../context-menu/context-menu-view.component';
import { ContextMenuService } from '../../context-menu.service';
import { State } from '@app/tracing/state/tracing.reducers';
import { SetGisGraphLayoutSOA, SetSelectedElementsSOA } from '@app/tracing/state/tracing.actions';
import { getGisGraphData, getGraphType, getShowLegend, getShowZoom } from '@app/tracing/state/tracing.selectors';

interface GraphSettingsState {
    fontSize: number;
    nodeSize: number;
    mergeDeliveriesType: MergeDeliveriesType;
    showMergedDeliveriesCounts: boolean;
}

interface GisGraphState extends GraphState, GraphSettingsState {
    layout: Layout;
    mapType: MapType;
    shapeFileData: ShapeFileData;
}
@Component({
    selector: 'fcl-gis-graph',
    templateUrl: './gis-graph.component.html',
    styleUrls: ['./gis-graph.component.scss']
})
export class GisGraphComponent implements OnInit, OnDestroy {

    @ViewChild('contextMenu', { static: true }) contextMenu: ContextMenuViewComponent;

    private componentIsActive = false;

    showZoom$ = this.store.select(getShowZoom);
    showLegend$ = this.store.select(getShowLegend);
    graphType$ = this.store.select(getGraphType);

    private graphStateSubscription: Subscription;
    private graphTypeSubscription: Subscription;

    legendInfo: LegendInfo;

    private cachedData: GraphServiceData;
    private graphData_: GraphData;
    private styleConfig_: StyleConfig;
    private mapConfig_: MapConfig;
    private unknownPosFrameData_: UnknownPosFrameData;

    constructor(
        private store: Store<State>,
        public elementRef: ElementRef,
        private graphService: GraphService,
        private gisPositioningService: GisPositioningService,
        private contextMenuService: ContextMenuService,
        private alertService: AlertService
    ) {}

    ngOnInit() {

        this.componentIsActive = true;

        this.graphTypeSubscription = this.graphType$.subscribe(
            type => {
                if (type !== GraphType.GIS) {
                    if (this.graphStateSubscription) {
                        this.graphStateSubscription.unsubscribe();
                        this.graphStateSubscription = null;
                    }
                } else {
                    if (!this.graphStateSubscription) {
                        this.graphStateSubscription = this.store
                            .select(getGisGraphData)
                            .pipe(filter(() => this.componentIsActive))
                            .subscribe(
                                graphState => this.applyState(graphState),
                                err => this.alertService.error(`getGisGraphData store subscription failed: ${err}`)
                            );
                    }
                }
            },
            err => this.alertService.error(`getGraphType store subscription failed: ${err}`)
        );
    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.graphTypeSubscription) {
            this.graphTypeSubscription.unsubscribe();
            this.graphTypeSubscription = null;
        }
        if (this.graphStateSubscription) {
            this.graphStateSubscription.unsubscribe();
            this.graphStateSubscription = null;
        }
    }

    getCanvas(): Promise<HTMLCanvasElement> {
        return html2canvas(this.elementRef.nativeElement);
    }

    onContextMenuRequest(requestInfo: ContextMenuRequestInfo): void {
        // console.log('Gis-Graph.onContextMenuRequest entered ...');
        const menuData = this.contextMenuService.getMenuData(requestInfo.context, this.cachedData, false);
        this.contextMenu.open(requestInfo.position, menuData);
        // console.log('Gis-Graph.onContextMenuRequest leaving ...');
    }

    onContextMenuSelection(action: Action): void {
        // console.log('Gis-Graph.onContextMenuSelection entered ...');
        if (action) {
            this.store.dispatch(action);
        }
        // console.log('Gis-Graph.onContextMenuSelection leaving ...');
    }

    onGraphDataChange(graphDataChange: GraphDataChange): void {
        // console.log('Gis-Graph.onGraphDataChange entered ...');
        if (graphDataChange.layout) {
            this.store.dispatch(new SetGisGraphLayoutSOA({ layout: graphDataChange.layout }));
        }
        if (graphDataChange.selectedElements) {
            this.store.dispatch(new SetSelectedElementsSOA({
                selectedElements: mapGraphSelectionToFclElementSelection(graphDataChange.selectedElements, this.cachedData)
            }));
        }
        // console.log('Gis-Graph.onGraphDataChange leaving ...');
    }

    get graphData(): GraphData {
        return this.graphData_;
    }

    get styleConfig(): StyleConfig {
        return this.styleConfig_;
    }

    get mapConfig(): MapConfig {
        return this.mapConfig_;
    }

    get unknownPosFrameData(): UnknownPosFrameData {
        return this.unknownPosFrameData_;
    }

    private getSelectedElements(newData: GraphServiceData): SelectedGraphElements {
        return (
            (
                !this.graphData_ ||
                !this.cachedData ||
                this.cachedData.nodeSel !== newData.nodeSel ||
                this.cachedData.edgeSel !== newData.edgeSel
            ) ?
                {
                    nodes: newData.nodeData.map(n => n.id).filter(id => newData.nodeSel[id]),
                    edges: newData.edgeData.map(e => e.id).filter(id => newData.edgeSel[id])
                } :
                this.graphData_.selectedElements
        );
    }

    private applyState(newState: GisGraphState) {
        // console.log('Gis-Graph.applyState entered ...');
        const newData: GraphServiceData = this.graphService.getData(newState);
        const posData = this.gisPositioningService.getPositioningData(newData);
        this.unknownPosFrameData_ = posData.frameData;

        const selectedElements = this.getSelectedElements(newData);
        this.graphData_ = {
            nodeData: newData.nodeData,
            edgeData: newData.edgeData,
            propsChangedFlag: newData.propsChangedFlag,
            edgeLabelChangedFlag: newData.edgeLabelChangedFlag,
            nodePositions: posData.nodePositions,
            layout: newState.layout,
            selectedElements: selectedElements
        };

        if (
            !this.styleConfig_ ||
            this.styleConfig_.fontSize !== newState.fontSize ||
            this.styleConfig_.nodeSize !== newState.nodeSize
        ) {

            this.styleConfig_ = {
                nodeSize: newState.nodeSize,
                fontSize: newState.fontSize
            };
        }

        if (
            newState.layout &&
            (
                !this.mapConfig_ ||
                this.mapConfig_.layout !== newState.layout ||
                this.mapConfig_.mapType !== newState.mapType ||
                this.mapConfig_.shapeFileData !== newState.shapeFileData
            )
        ) {
            this.mapConfig_ = {
                layout: newState.layout,
                mapType: newState.mapType,
                shapeFileData: newState.shapeFileData
            };
        }

        this.cachedData = newData;
        this.legendInfo = newData.legendInfo;
        // console.log('Gis-Graph.applyState leaving ...');
    }
}
