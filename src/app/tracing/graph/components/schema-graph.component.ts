import { Component, ElementRef, OnInit, OnDestroy, ViewChild } from '@angular/core';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import { Store } from '@ngrx/store';
import { Subject, timer, Subscription } from 'rxjs';
import cytoscape from 'cytoscape';
import html2canvas from 'html2canvas';
import { ResizeSensor } from 'css-element-queries';

import { Utils } from '../../util/non-ui-utils';

import { GraphState, Layout, Position, Size, GraphType } from '../../data.model';

import * as _ from 'lodash';
import { LayoutService, LayoutAction } from '../../layout/layout.service';
import { StyleService } from '../style.service';
import { GraphService } from '../graph.service';
import * as tracingSelectors from '../../state/tracing.selectors';
import { filter } from 'rxjs/operators';
import { Cy, CyNodeDef, CyEdgeDef, GraphServiceData } from '../graph.model';
import { AlertService } from '@app/shared/services/alert.service';
import * as tracingStoreActions from '../../state/tracing.actions';
import { GraphContextMenuComponent } from './graph-context-menu.component';

interface GraphSettingsState {
    fontSize: Size;
    nodeSize: Size;
    mergeDeliveries: boolean;
}

interface SchemaGraphState extends GraphState, GraphSettingsState {
    stationPositions: { [key: number]: Position };
    layout: Layout;
}

@Component({
    selector: 'fcl-schema-graph',
    templateUrl: './schema-graph.component.html',
    styleUrls: ['./schema-graph.component.scss']
})
export class SchemaGraphComponent implements OnInit, OnDestroy {

    private static readonly RENDERED_MIN_NODE_SIZE = 10;

    private static readonly ZOOM_FACTOR = 1.5;

    private static readonly NODE_SIZES: Map<Size, number> = new Map([[Size.SMALL, 50], [Size.MEDIUM, 75], [Size.LARGE, 100]]);

    private static readonly FONT_SIZES: Map<Size, number> = new Map([[Size.SMALL, 10], [Size.MEDIUM, 14], [Size.LARGE, 18]]);

    @ViewChild('container') containerElement: ElementRef;
    @ViewChild('graph') graphElement: ElementRef;
    @ViewChild('contextMenu') contextMenu: GraphContextMenuComponent;

    private componentIsActive = false;

    showZoom$ = this.store.select(state => state.tracing.fclData.graphSettings.showZoom);
    showLegend$ = this.store.select(state => state.tracing.fclData.graphSettings.showLegend);
    graphType$ = this.store.select(tracingSelectors.getGraphType);

    private graphStateSubscription: Subscription;
    private graphTypeSubscription: Subscription;

    zoomPercentage: number = 50;

    private cy: Cy;

    private cachedState: SchemaGraphState;
    private cachedData: GraphServiceData;

    private resizeTimerSubscription: Subscription;
    private hoverDeliveriesSubject: Subject<string[]> = new Subject();
    private hoverDeliveriesSubjectSubscription: Subscription;
    private selectionTimerSubscription: Subscription;

    private isPanning = false;

    constructor(
        private store: Store<fromTracing.State>,
        public elementRef: ElementRef,
        private layoutService: LayoutService,
        private styleService: StyleService,
        private graphService: GraphService,
        private alertService: AlertService
    ) {
        if (cytoscape != null) {
            this.layoutService.addLayoutManagerToCytoScape(cytoscape);
        }
    }

    ngOnInit() {
        window.onresize = () => {
            timer(500).subscribe(
                () => {
                    if (this.cy) {
                        this.cy.resize();
                    }
                },
                err => this.alertService.error(`onResize timer subscription failed: ${err}`)
            );
        };

        const resizeSensor = new ResizeSensor(this.containerElement.nativeElement, () => {
            if (!this.resizeTimerSubscription && this.cy) {
                this.resizeTimerSubscription = timer(100).subscribe(
                    () => {
                        this.resizeTimerSubscription.unsubscribe();
                        this.resizeTimerSubscription = null;
                        this.cy.resize();
                    },
                    err => this.alertService.error(`container resize subscription failed: ${err}`)
                );
            }
        });

        this.componentIsActive = true;

        this.graphTypeSubscription = this.graphType$.subscribe(
            type => {
                if (type !== GraphType.GRAPH) {
                    if (this.graphStateSubscription) {
                        this.graphStateSubscription.unsubscribe();
                        this.graphStateSubscription = null;
                    }
                } else {
                    if (!this.graphStateSubscription) {
                        this.graphStateSubscription = this.store.select(tracingSelectors.getSchemaGraphData).pipe(
                            filter(() => this.componentIsActive)
                        ).subscribe(
                            graphState => this.applyState(graphState),
                            err => this.alertService.error(`getSchemaGraphData store subscription failed: ${err}`)
                        );
                    }
                }
            },
            err => this.alertService.error(`getGraphType store subscription failed: ${err}`)
        );

        this.hoverDeliveriesSubjectSubscription = this.hoverDeliveriesSubject.subscribe(
            ids => {
                const edgeIds = Utils.createStringSet(
                    ids.map(id => this.cachedData.delIdToEdgeDataMap[id]).filter(data => !!data).map(data => data.id)
                );

                this.cy.batch(() => {
                    this.cy.edges().filter(e => !edgeIds[e.id()]).scratch('_active', false);
                    this.cy.edges().filter(e => !!edgeIds[e.id()]).scratch('_active', true);
                });
            },
            err => this.alertService.error(`hoverDelivieriesSubject subscription failed: ${err}`)
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

    private initCy(graphState: SchemaGraphState, graphData: GraphServiceData) {
        const sub = timer(0).subscribe(
            () => {
                this.cy = cytoscape({
                    container: this.graphElement.nativeElement,
                    elements: {
                        nodes: this.createNodes(graphState, graphData),
                        edges: this.createEdges(graphData)
                    },
                    layout: (
                        graphState.layout ?
                        { name: 'preset', zoom: graphState.layout.zoom, pan: graphState.layout.pan } :
                        { name: 'random' }
                    ),
                    style: this.styleService.createCyStyle(
                        {
                            fontSize: SchemaGraphComponent.FONT_SIZES.get(graphState.fontSize),
                            nodeSize: SchemaGraphComponent.NODE_SIZES.get(graphState.nodeSize),
                            zoom: graphState.layout ? graphState.layout.zoom : 1
                        },
                        graphData
                    ),
                    minZoom: 0.01,
                    maxZoom: 10,
                    wheelSensitivity: 0.5
                });

                this.cy.on('zoom', () => {
                    this.updateZoomPercentage();
                    this.updateGraphStyle(this.cachedState, this.cachedData);
                    this.applyLayoutToStateIfNecessary();
                });

                this.cy.on('pan', () => {
                    this.isPanning = true;
                });

                this.cy.on('tapstart', () => this.isPanning = false);

                this.cy.on('tapend', () => {
                    if (this.isPanning) {
                        this.applyLayoutToStateIfNecessary();
                    }
                });

                // nodes move
                this.cy.on('dragfreeon', () => this.applyNodePositionsToState());

                // click un/selection
                this.cy.on('tapselect', () => this.processGraphElementSelectionChange());
                this.cy.on('tapunselect', () => this.processGraphElementSelectionChange());

                // box selection
                this.cy.on('boxselect', () => this.processGraphElementSelectionChange());

                this.cy.on('layoutstop', () => this.applyNodePositionsAndLayoutToState(this.cachedState, this.cachedData));

                this.contextMenu.connect(this.cy, this.hoverDeliveriesSubject);

                this.updateZoomPercentage();

                if (!graphState.layout) {
                    this.applyNodePositionsAndLayoutToState(graphState, graphData);
                } else {
                    this.updateGraphStyle(graphState, graphData);
                }
            },
            err => this.alertService.error(`Cy graph could not be initialized: ${err}`)
        );
    }

    performLayoutAction(action: LayoutAction) {
        this.layoutService.runLayout(action.payload.layoutName, this.cy, SchemaGraphComponent.NODE_SIZES.get(this.cachedState.nodeSize));
    }

    private applyLayoutToStateIfNecessary() {
        if (
            !this.cachedState.layout ||
            this.cachedState.layout.zoom !== this.cy.zoom() ||
            this.cachedState.layout.pan.x !== this.cy.pan().x ||
            this.cachedState.layout.pan.y !== this.cy.pan().y
        ) {
            this.store.dispatch(new tracingStoreActions.SetSchemaGraphLayoutSOA({
                layout: {
                    zoom: this.cy.zoom(),
                    pan: { ...this.cy.pan() }
                }
            }));
        }
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

    private applyNodePositionsToState() {
        // apply old positions
        const stationPositions: {[key: string]: Position} = this.cachedData.stations.reduce((map, s) => {
            map[s.id] = this.cachedState.stationPositions[s.id];
            return map;
        }, {});
        // set new positions
        this.cy.nodes().forEach(node => {
            stationPositions[node.data().station.id] = (node.position());
        });

        this.store.dispatch(new tracingStoreActions.SetStationPositionsSOA({
            stationPositions: stationPositions
        }));
    }

    private applyNodePositionsAndLayoutToState(graphState: SchemaGraphState, graphData: GraphServiceData) {
        // apply old positions
        const stationPositions: {[key: string]: Position} = graphData.stations.reduce((map, s) => {
            map[s.id] = graphState.stationPositions[s.id];
            return map;
        }, {});
        // set new positions
        this.cy.nodes().forEach(node => {
            stationPositions[node.data().station.id] = (node.position());
        });

        this.store.dispatch(new tracingStoreActions.SetStationPositionsAndLayoutSOA({
            stationPositions: stationPositions,
            layout: { zoom: this.cy.zoom(), pan: { ...this.cy.pan() } }
        }));
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

    private updateFontSize(state: SchemaGraphState) {
        this.styleService.updateCyFontSize(this.cy, SchemaGraphComponent.FONT_SIZES.get(state.fontSize));
    }

    private updateGraphSelection(graphData: GraphServiceData) {
        if (this.cy != null) {
            this.cy.batch(() => {
                this.cy.elements(':selected[!selected]').unselect();
                this.cy.elements(':unselected[?selected]').select();
            });
        }
    }

    zoomInPressed() {
        this.zoomTo(this.cy.zoom() * SchemaGraphComponent.ZOOM_FACTOR);
    }

    zoomOutPressed() {
        this.zoomTo(this.cy.zoom() / SchemaGraphComponent.ZOOM_FACTOR);
    }

    zoomResetPressed() {
        if (this.cy.elements().size() === 0) {
            this.cy.reset();
        } else {
            this.cy.nodes().style({ 'font-size': 0 });
            this.cy.fit();
        }
        this.applyLayoutToStateIfNecessary();
    }

    zoomSlided(value: string) {
        this.zoomTo(Math.exp((Number(value) / 100) * Math.log(this.cy.maxZoom() / this.cy.minZoom())) * this.cy.minZoom());
    }

    private createNodes(graphState: SchemaGraphState, graphData: GraphServiceData): CyNodeDef[] {
        return graphData.nodeData.map(nodeData => ({
            group: 'nodes',
            data: nodeData,
            selected: nodeData.selected,
            position: graphState.stationPositions[nodeData.station.id]
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

    private updateGraph(graphState: SchemaGraphState, graphData: GraphServiceData) {
        this.cy.batch(() => {
            this.cy.elements().remove();
            this.cy.add(this.createNodes(graphState, graphData));
            this.cy.add(this.createEdges(graphData));

            this.updateGraphLayout(graphState, graphData);
        });
    }

    private updateGraphStyle(graphState: SchemaGraphState, graphData: GraphServiceData) {
        if (this.cy && this.cy.style) {
            this.cy.setStyle(this.styleService.createCyStyle(
                {
                    fontSize: SchemaGraphComponent.FONT_SIZES.get(graphState.fontSize),
                    nodeSize: SchemaGraphComponent.NODE_SIZES.get(graphState.nodeSize),
                    zoom: graphState.layout.zoom
                },
                graphData
            ));
            this.cy.elements().scratch('_update', true);
        }
    }

    private zoomTo(newZoom: number) {
        newZoom = Math.min(Math.max(newZoom, this.cy.minZoom()), this.cy.maxZoom());

        if (newZoom !== this.cy.zoom()) {
            this.cy.zoom({
                level: newZoom,
                renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 }
            });
        }
    }

    private updateZoomPercentage() {
        this.zoomPercentage = Math.round(
            (Math.log(this.cy.zoom() / this.cy.minZoom()) / Math.log(this.cy.maxZoom() / this.cy.minZoom())) * 100
        );
    }

    private updateGraphLayout(state: SchemaGraphState, data: GraphServiceData) {
        if (
            this.cy.zoom() !== state.layout.zoom ||
            !_.isEqual(this.cy.pan(), state.layout.pan)
            ) {
            this.cy.zoom(state.layout.zoom);
            this.cy.pan({ ...state.layout.pan });
            this.updateZoomPercentage();
            this.updateGraphStyle(state, data);
        }
    }

    private applyState(newState: SchemaGraphState) {
        const newData: GraphServiceData = this.graphService.getData(newState);
        if (!this.cachedData || this.cachedState.fclElements !== newState.fclElements || !newState.layout) {
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
        } else if (!_.isEqual(this.cachedState.layout, newState.layout)) {
            this.updateGraphLayout(newState, newData);
        }
        this.cachedData = {
            ...this.cachedData,
            ...newData
        };
        this.cachedState = {
            ...this.cachedState,
            ...newState
        };
    }
}
