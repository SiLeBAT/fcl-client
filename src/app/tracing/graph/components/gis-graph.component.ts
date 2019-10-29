import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subject, timer, Subscription } from 'rxjs';
import * as Hammer from 'hammerjs';
import * as ol from 'ol';
import { Tile } from 'ol/layer';
import { OSM } from 'ol/source';
import cytoscape from 'cytoscape';
import html2canvas from 'html2canvas';
import { ResizeSensor } from 'css-element-queries';
import { Utils as UIUtils } from '../../util/ui-utils';
import { Utils as NonUIUtils } from '../../util/non-ui-utils';
import { Layout, Position, Size, GraphState, GraphType, LegendInfo, MergeDeliveriesType } from '../../data.model';
import * as _ from 'lodash';
import { StyleService } from '../style.service';
import { Store } from '@ngrx/store';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import { Cy, CyNodeDef, CyEdgeDef, GraphServiceData } from '../graph.model';
import * as tracingSelectors from '../../state/tracing.selectors';
import { GraphService } from '../graph.service';
import { AlertService } from '@app/shared/services/alert.service';
import { filter } from 'rxjs/operators';
import * as tracingStoreActions from '../../state/tracing.actions';
import { GraphContextMenuComponent } from './graph-context-menu.component';

interface GraphSettingsState {
    fontSize: Size;
    nodeSize: Size;
    mergeDeliveriesType: MergeDeliveriesType;
    showMergedDeliveriesCounts: boolean;
}

interface GisGraphState extends GraphState, GraphSettingsState {
    layout: Layout;
}

@Component({
    selector: 'fcl-gis-graph',
    templateUrl: './gis-graph.component.html',
    styleUrls: ['./gis-graph.component.scss']
})
export class GisGraphComponent implements OnInit, OnDestroy {
    private static readonly MIN_ZOOM = 0.1;
    private static readonly MAX_ZOOM = 100.0;
    private static readonly ZOOM_FACTOR = 1.5;

    private static readonly NODE_SIZES: Map<Size, number> = new Map([[Size.SMALL, 12], [Size.MEDIUM, 25], [Size.LARGE, 50]]);

    private static readonly FONT_SIZES: Map<Size, number> = new Map([[Size.SMALL, 10], [Size.MEDIUM, 14], [Size.LARGE, 18]]);

    @ViewChild('container') containerElement: ElementRef;

    @ViewChild('map') mapElement: ElementRef;
    @ViewChild('graph') graphElement: ElementRef;
    @ViewChild('contextMenu') contextMenu: GraphContextMenuComponent;

    private componentIsActive = false;

    showZoom$ = this.store.select(tracingSelectors.getShowZoom);
    showLegend$ = this.store.select(tracingSelectors.getShowLegend);
    graphType$ = this.store.select(tracingSelectors.getGraphType);

    private graphStateSubscription: Subscription;
    private graphTypeSubscription: Subscription;

    zoomPercentage = 50;
    legendInfo: LegendInfo;

    private zoom: number;

    private cy: Cy;
    private map: ol.Map;

    private cachedState: GisGraphState;
    private cachedData: GraphServiceData;

    private resizeTimerSubscription: Subscription;
    private hoverDeliveriesSubject: Subject<string[]> = new Subject();
    private hoverDeliveriesSubjectSubscription: Subscription;
    private selectionTimerSubscription: Subscription;

    private isPanning = false;

    constructor(
        private store: Store<fromTracing.State>,
        public elementRef: ElementRef,
        private styleService: StyleService,
        private graphService: GraphService,
        private alertService: AlertService) {}

    ngOnInit() {
        this.map = new ol.Map({
            target: this.mapElement.nativeElement,
            layers: [
                new Tile({
                    source: new OSM()
                })
            ],
            controls: []
        });

        window.onresize = () => {
            timer(500).subscribe(
                () => {
                    if (this.cy) {
                        this.resizeGraphAndMap();
                    }
                },
                error => {
                    throw new Error(`error initializing gis component: ${error}`);
                }
            );
        };

        const resizeSensor = new ResizeSensor(this.containerElement.nativeElement, () => {
            if (!this.resizeTimerSubscription && this.cy) {
                this.resizeTimerSubscription = timer(100).subscribe(() => {
                    this.resizeTimerSubscription.unsubscribe();
                    this.resizeTimerSubscription = null;
                    this.resizeGraphAndMap();
                }, (error => {
                    throw new Error(`error resizing: ${error}`);
                }));
            }
        });

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
                        this.graphStateSubscription = this.store.select(tracingSelectors.getGisGraphData).pipe(
                            filter(() => this.componentIsActive)
                        ).subscribe(
                            graphState => this.applyState(graphState),
                            err => this.alertService.error(`getGisGraphData store subscription failed: ${err}`)
                        );
                    }
                }
            },
            err => this.alertService.error(`getGraphType store subscription failed: ${err}`)
        );

        this.hoverDeliveriesSubjectSubscription = this.hoverDeliveriesSubject.subscribe(
            ids => {
                const edgeIds = NonUIUtils.createStringSet(
                    ids.map(id => this.cachedData.delIdToEdgeDataMap[id]).filter(data => !!data).map(data => data.id)
                );

                this.cy.batch(() => {
                    this.cy.edges().filter(e => !edgeIds[e.id()]).scratch('_active', false);
                    this.cy.edges().filter(e => !!edgeIds[e.id()]).scratch('_active', true);
                });
            },
            error => {
                throw new Error(`${error}`);
            }
        );
    }

    ngOnDestroy() {
        this.componentIsActive = false;
        if (this.resizeTimerSubscription) {
            this.resizeTimerSubscription.unsubscribe();
            this.resizeTimerSubscription = null;
        }
        if (this.graphTypeSubscription) {
            this.graphTypeSubscription.unsubscribe();
            this.graphTypeSubscription = null;
        }
        if (this.graphStateSubscription) {
            this.graphStateSubscription.unsubscribe();
            this.graphStateSubscription = null;
        }
        if (this.hoverDeliveriesSubjectSubscription) {
            this.hoverDeliveriesSubjectSubscription.unsubscribe();
            this.hoverDeliveriesSubjectSubscription = null;
        }
        if (this.selectionTimerSubscription) {
            this.selectionTimerSubscription.unsubscribe();
            this.selectionTimerSubscription = null;
        }
    }

    private initCy(graphState: GisGraphState, graphData: GraphServiceData) {
        const sub = timer(0).subscribe(
            () => {
                const layout = (graphState.layout ? graphState.layout : this.getFitLayout(graphState, graphData));
                this.zoom = layout.zoom;
                this.cy = cytoscape({
                    container: this.graphElement.nativeElement,
                    elements: {
                        nodes: this.createNodes(layout, graphData),
                        edges: this.createEdges(graphData)
                    },
                    layout: { name: 'preset', zoom: 1, pan: layout.pan },
                    style: this.styleService.createCyStyle(
                        {
                            fontSize: GisGraphComponent.FONT_SIZES.get(graphState.fontSize),
                            nodeSize: GisGraphComponent.NODE_SIZES.get(graphState.nodeSize),
                            zoom: 1
                        },
                        graphData
                    ),
                    zoomingEnabled: false,
                    autoungrabify: true,
                    wheelSensitivity: 0.5
                });

                const hammer = new Hammer.Manager(
                    this.cy
                        .container()
                        .children.item(0)
                        .children.item(0),
                    { recognizers: [[Hammer.Pinch]] }
                );
                let pinchCenter: Position;
                let pinchScale: number;

                hammer.on('pinchstart', e => {
                    this.cy.userPanningEnabled(false);

                    const cyRect = this.cy.container().getBoundingClientRect();

                    pinchCenter = {
                        x: e.center.x - cyRect.left,
                        y: e.center.y - cyRect.top
                    };
                    pinchScale = e.scale;
                });
                hammer.on('pinchin pinchout', e => {
                    this.zoomTo((this.zoom * e.scale) / pinchScale, pinchCenter.x, pinchCenter.y);
                    pinchScale = e.scale;
                });
                hammer.on('pinchend pinchcancel', () => {
                    pinchCenter = null;
                    pinchScale = null;
                    this.cy.userPanningEnabled(true);
                });
                this.cy.container().children.item(0).children.item(0).addEventListener(
                    'wheel',
                    (e: WheelEvent) => {
                        this.zoomTo(
                            this.zoom * Math.pow(10, e.deltaMode === 1 ? e.deltaY / -25 : e.deltaY / -250),
                            e.offsetX,
                            e.offsetY
                        );
                    },
                    false
                );

                this.cy.on('pan', () => {
                    this.updateMap();
                    this.isPanning = true;
                });

                this.cy.on('tapstart', () => this.isPanning = false);

                this.cy.on('tapend', () => {
                    if (this.isPanning) {
                        this.applyLayoutToStateIfNecessary();
                    }
                });

                // click un/selection
                this.cy.on('tapselect', event => this.processGraphElementSelectionChange());
                this.cy.on('tapunselect', event => this.processGraphElementSelectionChange());

                // box selection
                this.cy.on('boxselect', event => this.processGraphElementSelectionChange());

                this.contextMenu.connect(this.cy, this.hoverDeliveriesSubject);

                this.updateFontSize(graphState);

                this.updateZoomPercentage();

                this.resizeGraphAndMap();

                if (!graphState.layout) {
                    this.applyLayoutToStateIfNecessary();
                }
            },
            err => this.alertService.error(`Cy graph could not be initialized: ${err}`)
        );
    }

    private updateMap() {
        this.map.setView(UIUtils.panZoomToView(this.cy.pan(), this.zoom, this.cy.width(), this.cy.height()));
    }

    private processGraphElementSelectionChange() {
        if (!this.selectionTimerSubscription) {
            this.selectionTimerSubscription = timer(0).subscribe(
                () => {
                    this.selectionTimerSubscription.unsubscribe();
                    this.selectionTimerSubscription = null;
                    this.applyElementSelectionToState();
                },
                error => {
                    throw new Error(`${error}`);
                }
            );
        }
    }

    private applyElementSelectionToState() {
        const selectedNodes = this.cy.nodes(':selected');
        const selectedEdges = this.cy.edges(':selected');

        this.store.dispatch(new tracingStoreActions.SetSelectedElementsSOA({
            selectedElements: {
                stations: selectedNodes.map(node => node.data().station.id),
                deliveries: [].concat(...selectedEdges.map(edge => (
                    edge.data().selected ?
                    edge.data().deliveries.filter(d => d.selected).map(d => d.id) :
                    edge.data().deliveries.map(d => d.id))
                ))
            }
        }));
    }

    getCanvas(): Promise<HTMLCanvasElement> {
        return html2canvas(this.containerElement.nativeElement);
    }

    zoomInPressed() {
        this.zoomTo(this.zoom * GisGraphComponent.ZOOM_FACTOR, this.cy.width() / 2, this.cy.height() / 2);
    }

    zoomOutPressed() {
        this.zoomTo(this.zoom / GisGraphComponent.ZOOM_FACTOR, this.cy.width() / 2, this.cy.height() / 2);
    }

    zoomResetPressed() {
        this.applyGraphLayout(this.getFitLayout(this.cachedState, this.cachedData));
    }

    zoomSlided(value: string) {
        this.zoomTo(
            Math.exp((Number(value) / 100) * Math.log(this.cy.maxZoom() / this.cy.minZoom())) * this.cy.minZoom(),
            this.cy.width() / 2,
            this.cy.height() / 2
        );
    }

    private createNodes(layout: Layout, graphData: GraphServiceData): CyNodeDef[] {
        return graphData.nodeData.map(nodeData => ({
            group: 'nodes',
            data: nodeData,
            selected: nodeData.selected,
            position:  UIUtils.latLonToPosition(nodeData.station.lat, nodeData.station.lon, this.zoom)
        }));
    }

    private createEdges(graphData: GraphServiceData): CyEdgeDef[] {
        return graphData.edgeData.map(edgeData => ({
            group: 'edges',
            data: edgeData,
            selected: edgeData.selected
        }));
    }

    private updateGraphEdges(graphData: GraphServiceData) {
        this.cy.batch(() => {
            this.cy.edges().remove();
            this.cy.add(this.createEdges(graphData));
        });
    }

    private updateGraph(graphState: GisGraphState, graphData: GraphServiceData) {
        this.cy.batch(() => {
            this.cy.elements().remove();
            this.cy.add(this.createNodes(graphState.layout, graphData));
            this.cy.add(this.createEdges(graphData));
            this.updateGraphStyle(graphState, graphData);
        });
        this.updateMap();
    }

    private updateGraphStyle(graphState: GisGraphState, graphData: GraphServiceData) {
        if (this.cy && this.cy.style) {
            this.cy.setStyle(this.styleService.createCyStyle(
                {
                    fontSize: GisGraphComponent.FONT_SIZES.get(graphState.fontSize),
                    nodeSize: GisGraphComponent.NODE_SIZES.get(graphState.nodeSize),
                    zoom: 1
                },
                graphData
            ));
            this.cy.elements().scratch('_update', true);
        }
    }

    private updateFontSize(state: GisGraphState) {
        this.styleService.updateCyFontSize(this.cy, GisGraphComponent.FONT_SIZES.get(state.fontSize));
    }

    private updateGraphSelection(graphData: GraphServiceData) {
        if (this.cy != null) {
            this.cy.batch(() => {
                this.cy.elements(':selected[!selected]').unselect();
                this.cy.elements(':unselected[?selected]').select();
                this.cy.elements().scratch('_update', true);
            });
        }
    }

    private zoomTo(newZoom: number, zx: number, zy: number) {
        newZoom = Math.min(Math.max(newZoom, GisGraphComponent.MIN_ZOOM), GisGraphComponent.MAX_ZOOM);
        const newPan = {
            x: zx + ((this.cy.pan().x - zx) * newZoom) / this.zoom,
            y: zy + ((this.cy.pan().y - zy) * newZoom) / this.zoom
        };
        const oldPan = this.cy.pan();
        if (newZoom !== this.zoom || newPan.x !== oldPan.x || newPan.y !== oldPan.y) {
            this.applyGraphLayout({
                zoom: newZoom,
                pan: newPan
            });
        }
    }

    private applyGraphLayout(layout: Layout) {
        this.zoom = layout.zoom;
        this.cy.batch(() => {
            this.cy.pan(layout.pan);
            this.cy.nodes().positions(node => UIUtils.latLonToPosition(node.data().station.lat, node.data().station.lon, this.zoom));
        });
        this.map.setView(UIUtils.panZoomToView(layout.pan, this.zoom, this.cy.width(), this.cy.height()));
        this.applyLayoutToStateIfNecessary();
        this.updateZoomPercentage();
    }

    private updateZoomPercentage() {
        this.zoomPercentage = Math.round(
            (Math.log(this.zoom / GisGraphComponent.MIN_ZOOM) / Math.log(GisGraphComponent.MAX_ZOOM / GisGraphComponent.MIN_ZOOM)) * 100
        );
    }

    private applyLayoutToStateIfNecessary() {
        if (
            !this.cachedState ||
            !this.cachedState.layout ||
            this.cachedState.layout.zoom !== this.zoom ||
            this.cachedState.layout.pan.x !== this.cy.pan().x ||
            this.cachedState.layout.pan.y !== this.cy.pan().y
        ) {
            this.store.dispatch(new tracingStoreActions.SetGisGraphLayoutSOA({
                layout: {
                    zoom: this.zoom,
                    pan: { ...this.cy.pan() }
                }
            }));
        }
    }

    private resizeGraphAndMap() {
        this.cy.resize();
        this.map.updateSize();
        this.updateMap();
    }

    private getFitLayout(graphState: GisGraphState, graphData: GraphServiceData): Layout {
        const width = this.containerElement.nativeElement.offsetWidth;
        const height = this.containerElement.nativeElement.offsetHeight;
        const border = GisGraphComponent.NODE_SIZES.get(graphState.nodeSize);

        let xMin = Number.POSITIVE_INFINITY;
        let yMin = Number.POSITIVE_INFINITY;
        let xMax = Number.NEGATIVE_INFINITY;
        let yMax = Number.NEGATIVE_INFINITY;

        for (const station of graphData.nodeData.map(data => data.station)) {
            if (
                station.lat !== undefined && station.lat !== null &&
                station.lon !== undefined && station.lon !== null
                ) {
                const p = UIUtils.latLonToPosition(station.lat, station.lon, 1.0);

                xMin = Math.min(xMin, p.x);
                yMin = Math.min(yMin, p.y);
                xMax = Math.max(xMax, p.x);
                yMax = Math.max(yMax, p.y);
            }
        }

        let zoom: number;
        let pan: Position;

        if (xMax > xMin && yMax > yMin) {
            zoom = Math.min((width - 2 * border) / (xMax - xMin), (height - 2 * border) / (yMax - yMin));
        } else {
            zoom = 1;
        }

        if (Number.isFinite(xMin) && Number.isFinite(yMin) && Number.isFinite(xMax) && Number.isFinite(yMax)) {
            const panX1 = -xMin * zoom + border;
            const panY1 = -yMin * zoom + border;
            const panX2 = -xMax * zoom + width - border;
            const panY2 = -yMax * zoom + height - border;

            pan = { x: (panX1 + panX2) / 2, y: (panY1 + panY2) / 2 };
        } else {
            pan = { x: 0, y: 0 };
        }

        return { zoom: zoom, pan: pan };
    }

    private updateEdgeLabels() {
        if (this.cy && this.cy.style) {
            this.cy.edges().scratch('_update', true);
        }
    }

    private applyState(newState: GisGraphState) {
        const newData: GraphServiceData = this.graphService.getData(newState);
        if (!this.cachedData || this.cachedState.fclElements !== newState.fclElements) {
            this.initCy(newState, newData);
        } else if (this.cachedData.nodeData !== newData.nodeData) {
            this.updateGraph(newState, newData);
        } else if (this.cachedData.edgeData !== newData.edgeData) {
            this.updateGraphEdges(newData);
        } else if (this.cachedData.propsChangedFlag !== newData.propsChangedFlag) {
            this.updateGraphStyle(newState, newData);
        } else if (this.cachedData.nodeSel !== newData.nodeSel || this.cachedData.edgeSel !== newData.edgeSel) {
            this.updateGraphSelection(newData);
        } else if (this.cachedState.nodeSize !== newState.nodeSize) {
            this.updateGraphStyle(newState, newData);
        } else if (this.cachedState.fontSize !== newState.fontSize) {
            this.updateFontSize(newState);
        } else if (this.cachedData.edgeLabelChangedFlag !== newData.edgeLabelChangedFlag) {
            this.updateEdgeLabels();
        }
        this.cachedData = {
            ...this.cachedData,
            ...newData
        };
        this.cachedState = {
            ...this.cachedState,
            ...newState
        };
        this.legendInfo = newData.legendInfo;
    }
}
