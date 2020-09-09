import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subject, timer, Subscription } from 'rxjs';
import * as Hammer from 'hammerjs';
import * as ol from 'ol';

import html2canvas from 'html2canvas';
import { ResizeSensor } from 'css-element-queries';
import { Utils as UIUtils } from '../../../util/ui-utils';
import { Utils as NonUIUtils, Utils } from '../../../util/non-ui-utils';
import {
    Layout,
    Position,
    GraphState,
    GraphType,
    LegendInfo,
    StationData,
    DeliveryData,
    MergeDeliveriesType,
    MapType,
    ShapeFileData,
    PositionMap
} from '../../../data.model';
import * as _ from 'lodash';
import { StyleService } from '../../style.service';
import { Store } from '@ngrx/store';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import { Cy, CyNodeDef, CyEdgeDef, GraphServiceData, CyNodeData } from '../../graph.model';
import * as tracingSelectors from '../../../state/tracing.selectors';
import { GraphService } from '../../graph.service';
import { AlertService } from '@app/shared/services/alert.service';
import { filter } from 'rxjs/operators';
import * as tracingStoreActions from '../../../state/tracing.actions';
import { GraphContextMenuComponent } from '../graph-context-menu/graph-context-menu.component';

import { EdgeLabelOffsetUpdater } from '../../edge-label-offset-updater';
import { removeFrameLayer, setFrameLayer, createOpenLayerMap, updateMapType } from '@app/tracing/util/map-utils';
// import { GraphData, StyleConfig } from '../../cy-graph';
import { LayoutChange, LayoutOnlyChange } from '../graph-view/graph-view.component';
import { SelectedGraphElements, GraphData } from '../graph-view/cy-graph';
import { mapGraphSelectionToFclElementSelection } from '../../graph-utils';
import { StyleConfig } from '../graph-view/cy-style';

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

    @ViewChild('contextMenu', { static: true }) contextMenu: GraphContextMenuComponent;

    private componentIsActive = false;

    showZoom$ = this.store.select(tracingSelectors.getShowZoom);
    showLegend$ = this.store.select(tracingSelectors.getShowLegend);
    graphType$ = this.store.select(tracingSelectors.getGraphType);

    private graphStateSubscription: Subscription;
    private graphTypeSubscription: Subscription;

    legendInfo: LegendInfo;

    // private cachedState: GisGraphState;
    // private cachedData: GraphServiceData;
    private graphData_: GraphData;
    private styleConfig_: StyleConfig;

    constructor(
        private store: Store<fromTracing.State>,
        public elementRef: ElementRef,
        private graphService: GraphService,
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
                            .select(tracingSelectors.getGisGraphData)
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

    onSelectionChange(selectedGraphElements: SelectedGraphElements): void {
        this.store.dispatch(new tracingStoreActions.SetSelectedElementsSOA({
            selectedElements: mapGraphSelectionToFclElementSelection(selectedGraphElements, this.graphData)
        }));
    }

    onLayoutChange(layoutChange: LayoutOnlyChange): void {
        this.store.dispatch(new tracingStoreActions.SetGisGraphLayoutSOA({ layout: layoutChange.layout }));
    }

    onPanChange(position: Position): void {
    }

    get graphData(): GraphData {
        return this.graphData_;
    }

    get styleConfig(): StyleConfig {
        return this.styleConfig_;
    }

    getSelectedElements(newData: GraphServiceData): SelectedGraphElements {
        return (
            (
                !this.graphData_ ||
                this.graphData_.selectedElements.nodeSel !== newData.nodeSel ||
                this.graphData_.selectedElements.edgeSel !== newData.edgeSel
            ) ?
                {
                    nodeSel: newData.nodeSel,
                    edgeSel: newData.edgeSel
                } :
                this.graphData_.selectedElements
        );
    }

    getPositions(newData: GraphServiceData): PositionMap {
        return (
            (
                !this.graphData_ ||
                this.graphData_.nodeData !== newData.nodeData
            ) ?
            Utils.createObjectFromArray(
                newData.nodeData,
                (n: CyNodeData) => n.id,
                (n: CyNodeData) => ({ x: n.station.lat * 100, y: n.station.lon * 100 })) :
            this.graphData_.nodePositions
        );
    }

    private applyState(newState: GisGraphState) {
        const newData: GraphServiceData = this.graphService.getData(newState);
        // if (!this.graphData_ ||
        //     this.graphData_.nodeData !== newData.nodeData ||
        //     this.graphData_.edgeData !== newData.edgeData ||
        //     this.graphData_.propsChangedFlag !==) {
        //     this.graphData_ = {
        //         nodeData: newData.nodeData,
        //         edgeData: newData.edgeData,
        //         propsChangedFlag: newData.propsChangedFlag,
        //         edgeLabelChangedFlag: newData.edgeLabelChangedFlag,
        //         nodePositions: this.getPositions(newData),
        //         layout: newState.layout,
        //         selectedElements: this.getSelectedElements(newData)
        //     };
        // } else {
        this.graphData_ = {
            nodeData: newData.nodeData,
            edgeData: newData.edgeData,
            propsChangedFlag: newData.propsChangedFlag,
            edgeLabelChangedFlag: newData.edgeLabelChangedFlag,
            nodePositions: this.getPositions(newData),
            layout: newState.layout,
            selectedElements: this.getSelectedElements(newData)
        };
        // }
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

        // if (!this.cachedData || this.cachedState.fclElements !== newState.fclElements) {
        //     this.initCy(newState, newData);
        // } else if (this.cachedData.nodeData !== newData.nodeData) {
        //     this.updateGraph(newState, newData);
        // } else if (this.cachedData.edgeData !== newData.edgeData) {
        //     this.updateGraphEdges(newData);
        // } else if (this.cachedData.propsChangedFlag !== newData.propsChangedFlag) {
        //     this.updateGraphStyle(newState, newData);
        // } else if (
        //     !this.selectionTimerSubscription &&
        //     (this.cachedData.nodeSel !== newData.nodeSel || this.cachedData.edgeSel !== newData.edgeSel)) {
        //     this.updateGraphSelection(newData);
        // } else if (this.cachedState.nodeSize !== newState.nodeSize) {
        //     this.updateGraphStyle(newState, newData);
        // } else if (this.cachedState.fontSize !== newState.fontSize) {
        //     this.updateGraphStyle(newState, newData);
        // } else if (this.cachedData.edgeLabelChangedFlag !== newData.edgeLabelChangedFlag) {
        //     this.updateEdgeLabels();
        // } else if (
        //     this.cachedState.mapType !== newState.mapType ||
        //     this.cachedState.shapeFileData !== newState.shapeFileData
        // ) {
        //     this.applyMapType(newState);
        // }
        // this.cachedData = {
        //     ...this.cachedData,
        //     ...newData
        // };
        // this.cachedState = {
        //     ...this.cachedState,
        //     ...newState
        // };
        this.legendInfo = newData.legendInfo;
    }
}
