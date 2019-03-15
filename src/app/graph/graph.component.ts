import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatMenuTrigger, MatSlider } from '@angular/material';
import { Observable, Subject } from 'rxjs/Rx';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import spread from 'cytoscape-spread';
import html2canvas from 'html2canvas';
import { ResizeSensor } from 'css-element-queries';

import {
  DialogActionsComponent,
  DialogActionsData
} from '../dialog/dialog-actions/dialog-actions.component';
import {
  DialogPromptComponent,
  DialogPromptData
} from '../dialog/dialog-prompt/dialog-prompt.component';
import {
  DialogSingleSelectComponent,
  DialogSingleSelectData
} from '../dialog/dialog-single-select/dialog-single-select.component';
import {
  StationPropertiesComponent,
  StationPropertiesData
} from '../dialog/station-properties/station-properties.component';
import {
  DeliveryPropertiesComponent,
  DeliveryPropertiesData
} from '../dialog/delivery-properties/delivery-properties.component';
import { Utils } from '../util/utils';
import { TracingService } from '../tracing/tracing.service';
import {
  Color,
  CyEdge,
  CyNode,
  DeliveryData,
  FclElements,
  Layout,
  ObservedType,
  Position,
  Size,
  StationData,
  GroupMode
} from '../util/datatypes';
import { FruchtermanLayout } from './fruchterman_reingold';
import { FarmToForkLayout } from './layoutmanager/farm_to_fork/farm_to_fork';
import { Constants } from '../util/constants';
import * as _ from 'lodash';

interface MenuAction {
    name: string;
    enabled: boolean;
    toolTip: string;
    action: (event: MouseEvent) => void;
}

@Component({
  // tslint:disable-next-line:component-selector
    selector: 'app-graph',
    templateUrl: './graph.component.html',
    styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {
    private static readonly ZOOM_FACTOR = 1.5;

    private static readonly NODE_SIZES: Map<Size, number> = new Map([
    [Size.SMALL, 50],
    [Size.MEDIUM, 75],
    [Size.LARGE, 100]
    ]);

    private static readonly FONT_SIZES: Map<Size, number> = new Map([
    [Size.SMALL, 10],
    [Size.MEDIUM, 14],
    [Size.LARGE, 18]
    ]);

    @ViewChild('container') containerElement: ElementRef;
    @ViewChild('graph') graphElement: ElementRef;

    @ViewChild('slider') slider: MatSlider;
    @ViewChild('graphMenuTrigger') graphMenuTrigger: MatMenuTrigger;
    @ViewChild('graphMenuTrigger', { read: ElementRef })
  graphMenuTriggerElement: ElementRef;
    @ViewChild('stationMenuTrigger') stationMenuTrigger: MatMenuTrigger;
    @ViewChild('stationMenuTrigger', { read: ElementRef })
  stationMenuTriggerElement: ElementRef;
    @ViewChild('deliveryMenuTrigger') deliveryMenuTrigger: MatMenuTrigger;
    @ViewChild('deliveryMenuTrigger', { read: ElementRef })
  deliveryMenuTriggerElement: ElementRef;
    @ViewChild('layoutMenuTrigger') layoutMenuTrigger: MatMenuTrigger;
    @ViewChild('layoutMenuTrigger', { read: ElementRef })
  layoutMenuTriggerElement: ElementRef;
    @ViewChild('collapseMenuTrigger') collapseMenuTrigger: MatMenuTrigger;
    @ViewChild('collapseMenuTrigger', { read: ElementRef })
  collapseMenuTriggerElement: ElementRef;
    @ViewChild('uncollapseMenuTrigger') uncollapseMenuTrigger: MatMenuTrigger;
    @ViewChild('uncollapseMenuTrigger', { read: ElementRef })
  uncollapseMenuTriggerElement: ElementRef;
    @ViewChild('traceMenuTrigger') traceMenuTrigger: MatMenuTrigger;
    @ViewChild('traceMenuTrigger', { read: ElementRef })
  traceMenuTriggerElement: ElementRef;

    graphMenuActions = this.createGraphActions();
    stationMenuActions = this.createStationActions(null);
    deliveryMenuActions = this.createDeliveryActions(null);
    layoutMenuActions = this.createLayoutActions();
    collapseMenuActions = this.createCollapseActions();
    uncollapseMenuActions = this.createUncollapseActions();
    traceMenuActions = this.createTraceActions(null);

    showZoom = Constants.DEFAULT_GRAPH_SHOW_ZOOM;
    showLegend = Constants.DEFAULT_GRAPH_SHOW_LEGEND;
    legend: {
        name: string;
        color: string;
    }[] = Constants.PROPERTIES_WITH_COLORS.toArray().map(p => {
        const prop = Constants.PROPERTIES.get(p);

        return {
            name: prop.name,
            color: Utils.colorToCss(prop.color)
        };
    });
    zoomSliderValue: number;

    private sliding = false;

    private cy: any;
    private data: FclElements;
    private mergeMap: Map<string, string[]>;
    private mergeToMap: Map<string, string>;
    private changeFunction: () => void;

    private mergeDeliveries = Constants.DEFAULT_GRAPH_MERGE_DELIVERIES;
    private nodeSize = Constants.DEFAULT_GRAPH_NODE_SIZE;
    private fontSize = Constants.DEFAULT_GRAPH_FONT_SIZE;

    private contextMenuElement: any;
    private selectTimerActivated = true;
    private resizeTimer: any;
    private selectTimer: any;
    private hoverDeliveries: Subject<string[]> = new Subject();
    private hoverableEdges: any;

  //noinspection JSUnusedGlobalSymbols
    constructor(
    private tracingService: TracingService,
    private dialogService: MatDialog,
    public elementRef: ElementRef
  ) {
        if (cytoscape != null) {
            cytoscape.use(cola);
            cytoscape.use(dagre);
            cytoscape.use(spread);
            cytoscape('layout', 'fruchterman', FruchtermanLayout);
            cytoscape('layout', 'farm_to_fork', FarmToForkLayout);
        }
    }

    ngOnInit() {
        window.onresize = () => {
            Observable.timer(500).subscribe(() => {
                if (this.cy != null) {
                    this.cy.resize();
                }
            });
        };

        const resizeSensor = new ResizeSensor(
      this.containerElement.nativeElement,
      () => {
          if (this.resizeTimer != null) {
              this.resizeTimer.unsubscribe();
          }

          if (this.cy != null) {
              this.resizeTimer = Observable.timer(100).subscribe(() =>
            this.cy.resize()
          );
          }
      }
    );

        this.stationMenuTrigger.menuOpened.subscribe(() => this.updateOverlay());
        this.stationMenuTrigger.menuClosed.subscribe(() => this.updateOverlay());
        this.deliveryMenuTrigger.menuOpened.subscribe(() => this.updateOverlay());
        this.deliveryMenuTrigger.menuClosed.subscribe(() => this.updateOverlay());
        this.traceMenuTrigger.menuClosed.subscribe(() => this.updateOverlay());
    }

    init(data: FclElements, layout: Layout) {
        this.data = data;
        this.tracingService.init(data);

        this.cy = cytoscape({
            container: this.graphElement.nativeElement,

            elements: {
                nodes: this.createNodes(),
                edges: this.createEdges()
            },

            layout:
        layout != null
          ? { name: 'preset', zoom: layout.zoom, pan: layout.pan }
          : { name: 'random' },
            style: this.createStyle(),
            minZoom: 0.01,
            maxZoom: 10,
            wheelSensitivity: 0.5
        });

        this.cy.on('zoom', () => {
            this.setFontSize(this.fontSize);

            if (!this.sliding) {
                this.updateSlider();
            }
        });
        this.cy.on('select', event => this.setSelected(event.target.id(), true));
        this.cy.on('unselect', event => this.setSelected(event.target.id(), false));
        this.cy.on(
      'position',
      event =>
        (this.tracingService.getStationsById(
          [event.target.id()]
        )[0].position = event.target.position())
    );
        this.cy.on('cxttap', event => {
            const element = event.target;
            const position: Position = {
                x: event.originalEvent.offsetX,
                y: event.originalEvent.offsetY
            };

            if (element === this.cy) {
                this.contextMenuElement = null;
                Utils.openMenu(
          this.graphMenuTrigger,
          this.graphMenuTriggerElement,
          position
        );
            } else if (element.isNode()) {
                this.contextMenuElement = element;
                this.stationMenuActions = this.createStationActions(element);
                Utils.openMenu(
          this.stationMenuTrigger,
          this.stationMenuTriggerElement,
          position
        );
            } else if (element.isEdge()) {
                this.contextMenuElement = element;
                this.deliveryMenuActions = this.createDeliveryActions(element);
                Utils.openMenu(
          this.deliveryMenuTrigger,
          this.deliveryMenuTriggerElement,
          position
        );
            }
        });
        this.hoverDeliveries.subscribe(ids => {
            const idSet: Set<string> = new Set();

            for (const id of ids) {
                idSet.add(this.mergeToMap.has(id) ? this.mergeToMap.get(id) : id);
            }

            this.cy.batch(() => {
                this.hoverableEdges
          .filter(e => !idSet.has(e.id()))
          .scratch('_active', false);
                this.hoverableEdges
          .filter(e => idSet.has(e.id()))
          .scratch('_active', true);
            });
        });

        this.setFontSize(this.fontSize);
        this.setShowLegend(this.showLegend);
        this.updateSlider();

        for (const s of data.stations) {
            const pos = this.cy.getElementById(s.id).position();

            if (pos != null) {
                s.position = pos;
            }
        }
    }

    onChange(changeFunction: () => void) {
        this.changeFunction = changeFunction;
    }

    getLayout(): Layout {
        if (this.cy != null) {
            return {
                zoom: this.cy.zoom(),
                pan: this.cy.pan()
            };
        } else {
            return null;
        }
    }

    getCanvas(): Promise<HTMLCanvasElement> {
        return html2canvas(this.containerElement.nativeElement);
    }

    setMergeDeliveries(mergeDeliveries: boolean) {
        this.mergeDeliveries = mergeDeliveries;

        if (this.cy != null) {
            this.updateEdges();
        }
    }

    setNodeSize(nodeSize: Size) {
        this.nodeSize = nodeSize;

        if (this.cy != null) {
            this.updateProperties();
        }
    }

    setFontSize(fontSize: Size) {
        this.fontSize = fontSize;

        if (this.cy != null) {
            const size = GraphComponent.FONT_SIZES.get(fontSize);

            this.cy.nodes().style({
                'font-size': Math.max(size / this.cy.zoom(), size)
            });
        }
    }

    setShowLegend(showLegend: boolean) {
        this.showLegend = showLegend;
    }

    setShowZoom(showZoom: boolean) {
        this.showZoom = showZoom;
    }

    updateSelection() {
        if (this.cy != null) {
            this.selectTimerActivated = false;

            if (this.mergeDeliveries) {
                this.updateEdges();
                this.cy.batch(() => {
                    this.cy.nodes(':selected[!selected]').unselect();
                    this.cy.nodes(':unselected[?selected]').select();
                });
            } else {
                this.cy.batch(() => {
                    this.cy.elements(':selected[!selected]').unselect();
                    this.cy.elements(':unselected[?selected]').select();
                });
            }

            this.selectTimerActivated = true;
        }
    }

    zoomInPressed() {
        this.zoomTo(this.cy.zoom() * GraphComponent.ZOOM_FACTOR);
    }

    zoomOutPressed() {
        this.zoomTo(this.cy.zoom() / GraphComponent.ZOOM_FACTOR);
    }

    zoomResetPressed() {
        if (this.cy.elements().size() === 0) {
            this.cy.reset();
        } else {
            this.cy.nodes().style({ 'font-size': 0 });
            this.cy.fit();
        }
    }

    sliderChanged() {
        this.sliding = true;
        this.zoomTo(
      Math.exp(
        (this.slider.value / 100) *
          Math.log(this.cy.maxZoom() / this.cy.minZoom())
      ) * this.cy.minZoom()
    );
        this.sliding = false;
    }

    private createNodes(): CyNode[] {
        const nodes: CyNode[] = [];
        for (const s of this.data.stations) {
            if (!s.contained && !s.invisible) {
                nodes.push({
                    group: 'nodes',
                    data: s,
                    selected: s.selected,
                    position: s.position
                });
            }
        }

        return nodes;
    }

    private createEdges(): CyEdge[] {
        const edges: CyEdge[] = [];

        this.mergeMap = new Map();
        this.mergeToMap = new Map();

        if (this.mergeDeliveries) {
            const sourceTargetMap: Map<string, DeliveryData[]> = new Map();

            for (const d of this.data.deliveries) {
                if (!d.invisible) {
                    const key = d.source + Constants.ARROW_STRING + d.target;
                    const value = sourceTargetMap.get(key);

                    sourceTargetMap.set(key, value == null ? [d] : value.concat(d));
                }
            }

            sourceTargetMap.forEach((value, key) => {
                if (value.length === 1) {
                    edges.push({
                        group: 'edges',
                        data: value[0],
                        selected: value[0].selected
                    });
                } else {
                    const observedElement = value.find(
            d => d.observed !== ObservedType.NONE
          );
                    const selected = value.find(d => d.selected) != null;

                    value.forEach(d => this.mergeToMap.set(d.id, key));
                    this.mergeMap.set(key, value.map(d => d.id));
                    edges.push({
                        group: 'edges',
                        data: {
                            id: key,
                            name: key,
                            lot: null,
                            lotKey: null,
                            date: null,
                            source: value[0].source,
                            target: value[0].target,
                            originalSource: value[0].source,
                            originalTarget: value[0].target,
                            invisible: false,
                            selected: selected,
                            crossContamination: value.find(d => d.crossContamination) != null,
                            killContamination: value.find(d => d.killContamination) != null,
                            observed:
                observedElement != null
                  ? observedElement.observed
                  : ObservedType.NONE,
                            forward: value.find(d => d.forward) != null,
                            backward: value.find(d => d.backward) != null,
                            score: 0,
                            weight: _.sum(...value.map(d => d.weight)),
                            properties: []
                        },
                        selected: selected
                    });
                }
            });
        } else {
            for (const d of this.data.deliveries) {
                if (!d.invisible) {
                    edges.push({
                        group: 'edges',
                        data: d,
                        selected: d.selected
                    });
                }
            }
        }

        return edges;
    }

    private updateEdges() {
        this.cy.batch(() => {
            this.cy.edges().remove();
            this.cy.add(this.createEdges());
        });
    }

    private updateProperties() {
        this.updateStyle();
        if (this.mergeDeliveries) {
            this.updateEdges();
            this.cy.nodes().scratch('_update', true);
        } else {
            this.cy.elements().scratch('_update', true);
        }
    }

    private updateAll() {
        const containerMap: Map<string, string> = new Map();
        for (const s of this.data.stations) {
            if (s.contains != null) {
                for (const id of s.contains) {
                    containerMap.set(id, s.id);
                }
            }
        }

        for (const s of this.data.stations) {
            if (!s.contained && s.positionRelativeTo != null) {
                s.position = Utils.sum(
          this.cy.getElementById(s.positionRelativeTo).position(),
          s.position
        );
                s.positionRelativeTo = null;
            } else if (
        s.contained &&
        s.positionRelativeTo != null &&
        s.positionRelativeTo !== containerMap.get(s.id)
      ) {
                s.position = Utils.sum(
          this.cy.getElementById(s.positionRelativeTo).position(),
          s.position
        );
                s.positionRelativeTo = null;
            } else if (s.position == null && s.contains != null) {
                for (const contained of this.tracingService.getStationsById(
          s.contains
        )) {
                    if (contained.positionRelativeTo != null) {
                        contained.position = Utils.sum(
              this.cy.getElementById(contained.positionRelativeTo).position(),
              contained.position
            );
                        contained.positionRelativeTo = null;
                    }
                }

                s.position = Utils.getCenter(
          s.contains.map(
            id => this.tracingService.getStationsById([id])[0].position
          )
        );

                for (const contained of this.tracingService.getStationsById(
          s.contains
        )) {
                    contained.position = Utils.difference(contained.position, s.position);
                    contained.positionRelativeTo = s.id;
                }
            }
        }

        this.cy.batch(() => {
            this.cy.elements().remove();
            this.cy.add(this.createNodes());
            this.cy.add(this.createEdges());
            this.setFontSize(this.fontSize);
        });
    }

    private createSmallGraphStyle(): any {
    /*const sizeFunction = node => {
      const size = GraphComponent.NODE_SIZES.get(this.nodeSize) / 2;

      if (this.tracingService.getMaxScore() > 0) {
        return (0.5 + 0.5 * node.data('score') / this.tracingService.getMaxScore()) * size;
      } else {
        return size;
      }
    };*/
        const nodeSizeMap: string = this.createNodeSizeMap();

        let style = cytoscape
      .stylesheet()
      .selector('*')
      .style({
        'overlay-color': 'rgb(0, 0, 255)',
        'overlay-padding': 10,
        'overlay-opacity': e => (e.scratch('_active') ? 0.5 : 0.0)
      })
      .selector('node')
      .style({
        content: 'data(name)',
        // 'height': sizeFunction, // ToDO: replace by linear function (data or dataMap)
        // 'width': sizeFunction,  // ToDo: replace by linear function (data or dataMap)
        // 'height': 'mapData(score, 0, 1, 20, 40)', // linear function ToDo: add size attr to node
        // 'width': 'mapData(score, 0, 1, 20, 40)',  // linear function
        height: nodeSizeMap, // 'mapData(score, 0, 1, 20, 40)', // linear function ToDo: add size attr to node
        width: nodeSizeMap, // 'mapData(score, 0, 1, 20, 40)',  // linear function
        'background-color': 'rgb(255, 255, 255)',
        'border-width': 3,
        'border-color': 'rgb(0, 0, 0)',
        'text-valign': 'bottom',
        'text-halign': 'right',
        color: 'rgb(0, 0, 0)'
      })
      .selector('edge')
      .style({
        'target-arrow-shape': 'triangle',
        width: 1, // , //        'width': 6,
        'line-color': 'rgb(0, 0, 0)',
        'target-arrow-color': 'rgb(0, 0, 0)',
        'arrow-scale': 1.4,
        'curve-style': 'bezier' // performance reasons
      })
      .selector('node:selected')
      .style({
        'background-color': 'rgb(128, 128, 255)',
        'border-width': 6,
        'border-color': 'rgb(0, 0, 255)',
        color: 'rgb(0, 0, 255)'
      })
      .selector('edge:selected')
      .style({
        width: 2 // 4
      })
      .selector('node[?contains]')
      .style({
        'border-width': 3 // 6 // ToDo: Clarify, what is this for
      })
      .selector('node:selected[?contains]')
      .style({
        'border-width': 3 // 9 // ToDo: Clarify, what is this for
      })
      .selector(':active')
      .style({
          'overlay-opacity': 0.5
      });

        const createSelector = (prop: string) => {
            if (prop === 'observed') {
                return '[' + prop + ' != "' + ObservedType.NONE + '"]';
            } else {
                return '[?' + prop + ']';
            }
        };

        const createNodeBackground = (colors: Color[]) => {
            const background = {};

            if (colors.length === 1) {
                background['background-color'] = Utils.colorToCss(colors[0]);
            } else {
                for (let i = 0; i < colors.length; i++) {
                    background['pie-' + (i + 1) + '-background-color'] = Utils.colorToCss(
            colors[i]
          );
                    background['pie-' + (i + 1) + '-background-size'] =
            100 / colors.length;
                }
            }

            return background;
        };

        for (const combination of Utils.getAllCombinations(
      Constants.PROPERTIES_WITH_COLORS.toArray()
    )) {
            const s = [];
            const c1 = [];
            const c2 = [];

            for (const prop of combination) {
                const color = Constants.PROPERTIES.get(prop).color;

                s.push(createSelector(prop));
                c1.push(color);
                c2.push(Utils.mixColors(color, { r: 0, g: 0, b: 255 }));
            }

            style = style
        .selector('node' + s.join(''))
        .style(createNodeBackground(c1));
            style = style
        .selector('node:selected' + s.join(''))
        .style(createNodeBackground(c2));
        }

        for (const prop of Constants.PROPERTIES_WITH_COLORS.toArray()) {
            style = style.selector('edge' + createSelector(prop)).style({
                'line-color': Utils.colorToCss(Constants.PROPERTIES.get(prop).color)
            });
        }

        return style;
    }

    private createLargeGraphStyle(): any {
    /*const sizeFunction = node => {
      const size = GraphComponent.NODE_SIZES.get(this.nodeSize);

      if (this.tracingService.getMaxScore() > 0) {
        return (0.5 + 0.5 * node.data('score') / this.tracingService.getMaxScore()) * size;
      } else {
        return size;
      }
    };*/
        const nodeSizeMap: string = this.createNodeSizeMap();

        let style = cytoscape
      .stylesheet()
      .selector('*')
      .style({
        'overlay-color': 'rgb(0, 0, 255)',
        'overlay-padding': 10,
        'overlay-opacity': e => (e.scratch('_active') ? 0.5 : 0.0)
      })
      .selector('node')
      .style({
        // 'content': 'data(name)',
        // 'height': sizeFunction, // PF test
        // 'width': sizeFunction,  // PF test
        // 'height': 'mapData(score, 0, 1, 20, 40)', // linear function ToDo: add size attr to node
        // 'width': 'mapData(score, 0, 1, 20, 40)',  // linear function
        height: nodeSizeMap, // 'mapData(score, 0, 1, 20, 40)', // linear function ToDo: add size attr to node
        width: nodeSizeMap, // 'mapData(score, 0, 1, 20, 40)',  // linear function
        'background-color': 'rgb(255, 255, 255)',
        // 'border-width': 3,
        'border-color': 'rgb(0, 0, 0)',
        // 'text-valign': 'bottom',
        // 'text-halign': 'right',
        color: 'rgb(0, 0, 0)'
        // 'min-zoomed-font-size':10   // performance reasons
      })
      .selector('edge')
      .style({
        // 'target-arrow-shape': 'triangle', // test reason
        // large graphs
        'mid-target-arrow-shape': 'triangle', // test reason
        // 'mid-target-arrow-fill': 'hollow', // test reason
        'mid-target-arrow-color': 'rgb(0, 0, 0)', // test reason
        width: 1, // , //        'width': 6,
        'line-color': 'rgb(0, 0, 0)',
        // 'target-arrow-color': 'rgb(255, 0, 0)', // test reason
        'arrow-scale': 1.4 // test reason
        // 'curve-style': 'bezier'   // performance reasons
      })
      .selector('node:selected')
      .style({
        'background-color': 'rgb(128, 128, 255)',
        // 'border-width': 6,
        'border-color': 'rgb(0, 0, 255)',
        color: 'rgb(0, 0, 255)'
      })
      .selector('edge:selected')
      .style({
        width: 2 // 12
      })
      .selector('node[?contains]')
      .style({
        'border-width': 3 // 6 // ToDo: Clarify, what is this for
      })
      .selector('node:selected[?contains]')
      .style({
        'border-width': 3 // 9 // ToDo: Clarify, what is this for
      })
      .selector(':active')
      .style({
        'overlay-opacity': 0.5
      })
      .selector(':selected')
      .css({
          'background-color': 'black',
          opacity: 1
      });

        const createSelector = (prop: string) => {
            if (prop === 'observed') {
                return '[' + prop + ' != "' + ObservedType.NONE + '"]';
            } else {
                return '[?' + prop + ']';
            }
        };

        const createNodeBackground = (colors: Color[]) => {
            const background = {};

            if (colors.length === 1) {
                background['background-color'] = Utils.colorToCss(colors[0]);
            } else {
                for (let i = 0; i < colors.length; i++) {
                    background['pie-' + (i + 1) + '-background-color'] = Utils.colorToCss(
            colors[i]
          );
                    background['pie-' + (i + 1) + '-background-size'] =
            100 / colors.length;
                }
            }

            return background;
        };

        for (const combination of Utils.getAllCombinations(
      Constants.PROPERTIES_WITH_COLORS.toArray()
    )) {
            const s = [];
            const c1 = [];
            const c2 = [];

            for (const prop of combination) {
                const color = Constants.PROPERTIES.get(prop).color;

                s.push(createSelector(prop));
                c1.push(color);
                c2.push(Utils.mixColors(color, { r: 0, g: 0, b: 255 }));
            }

            style = style
        .selector('node' + s.join(''))
        .style(createNodeBackground(c1));
            style = style
        .selector('node:selected' + s.join(''))
        .style(createNodeBackground(c2));
        }

        for (const prop of Constants.PROPERTIES_WITH_COLORS.toArray()) {
            style = style.selector('edge' + createSelector(prop)).style({
                'line-color': Utils.colorToCss(Constants.PROPERTIES.get(prop).color)
            });
        }

        return style;
    }

    private createHugeGraphStyle(): any {
    /*const sizeFunction = node => {
      const size = GraphComponent.NODE_SIZES.get(this.nodeSize);

      if (this.tracingService.getMaxScore() > 0) {
        return (0.5 + 0.5 * node.data('score') / this.tracingService.getMaxScore()) * size;
      } else {
        return size;
      }
    };*/
    /*this.nodeSizeMap = new Map();
    const cachedSizeFunction = (node)=>{
      if(!this.nodeSizeMap.has(node.id)) this.nodeSizeMap.set(node.id, sizeFunction(node));
      return this.nodeSizeMap.get(node.id);
    };        //_.memoize(sizeFunction);
    */

        const nodeSizeMap: string = this.createNodeSizeMap();

        let style = cytoscape
      .stylesheet()
      .selector('*')
      .style({
        'overlay-color': 'rgb(0, 0, 255)',
        'overlay-padding': 10,
        'overlay-opacity': e => (e.scratch('_active') ? 0.5 : 0.0)
      })
      .selector('node')
      .style({
        height: nodeSizeMap, // 'mapData(score, 0, 1, 20, 40)', // linear function ToDo: add size attr to node
        width: nodeSizeMap, // 'mapData(score, 0, 1, 20, 40)',  // linear function
        // 'content': 'data(name)', // no label
        'background-color': 'rgb(255, 255, 255)',
        'border-width': 2,
        'border-color': 'rgb(0, 0, 0)',
        // 'text-valign': 'bottom', // no label
        // 'text-halign': 'right', // no label
        color: 'rgb(0, 0, 0)'
        // 'min-zoomed-font-size':10   // performance reasons
      })
      .selector('edge')
      .style({
        'mid-target-arrow-shape': 'triangle', // haystack only works with mid-arrows
        'mid-target-arrow-color': 'rgb(0, 0, 0)', // test reason
        width: 1, //        'width': 6,
        'line-color': 'rgb(0, 0, 0)',
        'arrow-scale': 1.4 // test reason
        // 'curve-style': 'bezier'   // use haystack
      })
      .selector('node:selected')
      .style({
        'background-color': 'rgb(128, 128, 255)',
        // 'border-width': 6,
        'border-color': 'rgb(0, 0, 255)',
        color: 'rgb(0, 0, 255)'
      })
      .selector('edge:selected')
      .style({
        width: 2
      })
      .selector('node[?contains]')
      .style({
        'border-width': 3 // 6 // ToDo: Clarify, what is this for
      })
      .selector('node:selected[?contains]')
      .style({
        'border-width': 3 // 9 // ToDo: Clarify, what is this for
      })
      .selector(':active')
      .style({
          'overlay-opacity': 0.5
      });
    /*.selector(':selected')
    .css({
      'background-color': 'black',
      'opacity': 1
    });*/

        const createSelector = (prop: string) => {
            if (prop === 'observed') {
                return '[' + prop + ' != "' + ObservedType.NONE + '"]';
            } else {
                return '[?' + prop + ']';
            }
        };

        const createNodeBackground = (colors: Color[]) => {
            const background = {};

            if (colors.length === 1) {
                background['background-color'] = Utils.colorToCss(colors[0]);
            } else {
                for (let i = 0; i < colors.length; i++) {
                    background['pie-' + (i + 1) + '-background-color'] = Utils.colorToCss(
            colors[i]
          );
                    background['pie-' + (i + 1) + '-background-size'] =
            100 / colors.length;
                }
            }

            return background;
        };

        for (const combination of Utils.getAllCombinations(
      Constants.PROPERTIES_WITH_COLORS.toArray()
    )) {
            const s = [];
            const c1 = [];
            const c2 = [];

            for (const prop of combination) {
                const color = Constants.PROPERTIES.get(prop).color;

                s.push(createSelector(prop));
                c1.push(color);
                c2.push(Utils.mixColors(color, { r: 0, g: 0, b: 255 }));
            }

            style = style
        .selector('node' + s.join(''))
        .style(createNodeBackground(c1));
            style = style
        .selector('node:selected' + s.join(''))
        .style(createNodeBackground(c2));
        }

        for (const prop of Constants.PROPERTIES_WITH_COLORS.toArray()) {
            style = style.selector('edge' + createSelector(prop)).style({
                'line-color': Utils.colorToCss(Constants.PROPERTIES.get(prop).color)
            });
        }

        return style;
    }

    private createNodeSizeMap(): string {
        const size = GraphComponent.NODE_SIZES.get(this.nodeSize);
        const maxScore =
      this.tracingService.getMaxScore() > 0
        ? this.tracingService.getMaxScore()
        : 0;
        if (maxScore > 0) {
            return (
        'mapData(score, 0, ' +
        maxScore.toString() +
        ', ' +
        (size / 1.5).toString() +
        ',' +
        (size * 1.5).toString() +
        ')'
            );
        } else {
            return size.toString();
        }
    }

    private updateStyle() {
        if (this.cy !== null && this.cy.style !== null) {
            this.cy.setStyle(this.createStyle());
        }
    }

    private createStyle(): any {
        const MAX_STATION_NUMBER_FOR_SMALL_GRAPHS = 300; // 50
        const MAX_DELIVERIES_NUMBER_FOR_SMALL_GRAPHS = 500; // 100

    // return this.createSmallGraphStyle();
        if (this.data.stations.length > MAX_STATION_NUMBER_FOR_SMALL_GRAPHS) {
            return this.createHugeGraphStyle();
        } else if (
      this.data.deliveries.length > MAX_DELIVERIES_NUMBER_FOR_SMALL_GRAPHS
    ) {
            return this.createLargeGraphStyle();
        } else {
            return this.createSmallGraphStyle();
        }
    }

    private setSelected(id: string, selected: boolean) {
        if (this.mergeMap.has(id)) {
            for (const containedId of this.mergeMap.get(id)) {
                this.tracingService.setSelected(containedId, selected);
            }
        } else {
            this.tracingService.setSelected(id, selected);
        }

        if (this.selectTimerActivated) {
            if (this.selectTimer != null) {
                this.selectTimer.unsubscribe();
            }

            this.selectTimer = Observable.timer(50).subscribe(() =>
        this.callChangeFunction()
      );
        }
    }

    private createGraphActions(): MenuAction[] {
        return [
            {
                name: 'Apply Layout',
                enabled: true,
                toolTip: null,
                action: event =>
          Utils.openMenu(
            this.layoutMenuTrigger,
            this.layoutMenuTriggerElement,
            this.getCyCoordinates(event)
          )
            },
            {
                name: 'Clear Trace',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.tracingService.clearTrace();
                    this.updateProperties();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Clear Outbreak Stations',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.tracingService.clearOutbreakStations();
                    this.setNodeSize(this.nodeSize);
                    this.callChangeFunction();
                }
            },
            {
                name: 'Clear Invisibility',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.tracingService.clearInvisibility();
                    this.updateAll();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Collapse Stations',
                enabled: true,
                toolTip: null,
                action: event =>
          Utils.openMenu(
            this.collapseMenuTrigger,
            this.collapseMenuTriggerElement,
            this.getCyCoordinates(event)
          )
            },
            {
                name: 'Uncollapse Stations',
                enabled: true,
                toolTip: null,
                action: event =>
          Utils.openMenu(
            this.uncollapseMenuTrigger,
            this.uncollapseMenuTriggerElement,
            this.getCyCoordinates(event)
          )
            } /*, {
        name: 'Collapse Sources',
        enabled: true,
        action: () => {
          const options: { value: string, viewValue: string }[] = [];
          options.push({ value: GroupMode.WEIGHT_ONLY.toString(), viewValue: 'weight sensitive' });
          options.push({ value: GroupMode.PRODUCT_AND_WEIGHT.toString(), viewValue: 'product name and weight sensitive' });
          options.push({ value: GroupMode.LOT_AND_WEIGHT.toString(), viewValue: 'lot and weight sensitive' });

          const dialogData: DialogSingleSelectData = {
            title: 'Select collapse mode',
            options: options,
            value: GroupMode.WEIGHT_ONLY.toString()
          };

          this.dialogService.open(DialogSingleSelectComponent, {data: dialogData}).afterClosed().subscribe(groupMode => {
            this.updateOverlay();
            if (groupMode != null) {
              this.tracingService.collapseSourceStations(groupMode);
              this.updateAll();
              this.callChangeFunction();
            }
          });
        }
      }, {
        name: 'Collapse Targets',
        enabled: true,
        action: () => {
          const options: { value: string, viewValue: string }[] = [];
          options.push({ value: GroupMode.WEIGHT_ONLY.toString(), viewValue: 'weight sensitive' });
          options.push({ value: GroupMode.PRODUCT_AND_WEIGHT.toString(), viewValue: 'product name and weight sensitive' });
          options.push({ value: GroupMode.LOT_AND_WEIGHT.toString(), viewValue: 'lot and weight sensitive' });

          const dialogData: DialogSingleSelectData = {
            title: 'Select collapse mode',
            options: options,
            value: GroupMode.WEIGHT_ONLY.toString()
          };

          this.dialogService.open(DialogSingleSelectComponent, {data: dialogData}).afterClosed().subscribe(groupMode => {
            this.updateOverlay();
            if (groupMode != null) {
              this.tracingService.collapseTargetStations(groupMode);
              this.updateAll();
              this.callChangeFunction();
            }
          });
        }
      }, {
        name: 'Collapse Simple Chains',
        enabled: true,
        action: () => {
          this.updateOverlay();
          this.tracingService.collapseSimpleChains();
          this.updateAll();
          this.callChangeFunction();

        }
      }, {
        name: 'Collapse Isolated Clouds',
        enabled: true,
        action: () => {
          this.updateOverlay();
          this.tracingService.collapseIsolatedClouds();
          this.updateAll();
          this.callChangeFunction();

        }
      }*/
        ];
    }

    private createStationActions(node): MenuAction[] {
        let selectedNodes = null;
        let multipleStationsSelected = false;
        let allOutbreakStations = false;
        let allCrossContaminationStations = false;
        let allMetaStations = false;

        if (this.cy != null && node != null) {
            selectedNodes = this.cy.nodes(':selected');
            multipleStationsSelected = node.selected() && selectedNodes.size() > 1;
            allOutbreakStations = multipleStationsSelected
        ? selectedNodes.allAre('[?outbreak]')
        : node.data('outbreak');
            allCrossContaminationStations = multipleStationsSelected
        ? selectedNodes.allAre('[?crossContamination]')
        : node.data('crossContamination');
            allMetaStations = multipleStationsSelected
        ? selectedNodes.allAre('[?contains]')
        : node.data('contains');
        }

        return [
            {
                name: 'Show Properties',
                enabled: !multipleStationsSelected,
                toolTip: null,
                action: () => {
                    const station = this.tracingService.getStationsById([node.id()])[0];
                    const deliveries: Map<string, DeliveryData> = new Map();
                    const connectedStations: Map<string, StationData> = new Map();

                    for (const d of this.tracingService.getDeliveriesById(
            station.incoming
          )) {
                        deliveries.set(d.id, d);
                        connectedStations.set(
              d.source,
              this.tracingService.getStationsById([d.source])[0]
            );
                    }

                    for (const d of this.tracingService.getDeliveriesById(
            station.outgoing
          )) {
                        deliveries.set(d.id, d);
                        connectedStations.set(
              d.target,
              this.tracingService.getStationsById([d.target])[0]
            );
                    }

                    const dialogData: StationPropertiesData = {
                        station: station,
                        deliveries: deliveries,
                        connectedStations: connectedStations,
                        hoverDeliveries: this.hoverDeliveries
                    };

                    this.hoverableEdges = node.connectedEdges();
                    this.dialogService
            .open(StationPropertiesComponent, { data: dialogData })
            .afterClosed()
            .subscribe(connections => {
                this.updateOverlay();

                if (connections) {
                    this.tracingService.setConnectionsOfStation(
                  node.id(),
                  connections
                );
                    this.updateProperties();
                }
            });
                }
            },
            {
                name: 'Show Trace',
                enabled: !multipleStationsSelected,
                toolTip: null,
                action: event => {
                    this.traceMenuActions = this.createTraceActions(node);
                    Utils.openMenu(
            this.traceMenuTrigger,
            this.traceMenuTriggerElement,
            this.getCyCoordinates(event)
          );
                }
            },
            {
                name: allOutbreakStations ? 'Unmark as Outbreak' : 'Mark as Outbreak',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.tracingService.markStationsAsOutbreak(
            multipleStationsSelected
              ? selectedNodes.map(s => s.id())
              : [node.id()],
            !allOutbreakStations
          );
                    this.setNodeSize(this.nodeSize);
                    this.callChangeFunction();
                }
            },
            {
                name: allCrossContaminationStations
          ? 'Unset Cross Contamination'
          : 'Set Cross Contamination',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.tracingService.setCrossContaminationOfStations(
            multipleStationsSelected
              ? selectedNodes.map(s => s.id())
              : [node.id()],
            !allCrossContaminationStations
          );
                    this.updateProperties();
                    this.setNodeSize(this.nodeSize);
                    this.callChangeFunction();
                }
            },
            {
                name: 'Make Invisible',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.tracingService.makeStationsInvisible(
            multipleStationsSelected
              ? selectedNodes.map(s => s.id())
              : [node.id()]
          );
                    this.updateAll();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Merge Stations',
                enabled: multipleStationsSelected,
                toolTip: null,
                action: () => {
                    const dialogData: DialogPromptData = {
                        title: 'Input',
                        message: 'Please specify name of meta station:',
                        placeholder: 'Name'
                    };

                    this.dialogService
            .open(DialogPromptComponent, { data: dialogData })
            .afterClosed()
            .subscribe(name => {
                this.updateOverlay();

                if (name != null) {
                    this.tracingService.mergeStations(
                  selectedNodes.map(s => s.id()),
                  name
                );
                    this.updateAll();
                    this.callChangeFunction();
                }
            });
                }
            },
            {
                name: 'Expand',
                enabled: allMetaStations,
                toolTip: null,
                action: () => {
                    this.tracingService.expandStations(
            multipleStationsSelected
              ? selectedNodes.map(s => s.id())
              : node.id()
          );
                    this.updateAll();
                    this.callChangeFunction();
                }
            }
        ];
    }

    private createDeliveryActions(edge): MenuAction[] {
        return [
            {
                name: 'Show Properties',
                enabled: true,
                toolTip: null,
                action: () => {
                    if (this.mergeMap.has(edge.id())) {
                        Utils.showErrorMessage(
              this.dialogService,
              'Showing Properties of merged delivery is not supported!'
            )
              .afterClosed()
              .subscribe(() => this.updateOverlay());
                    } else {
                        const dialogData: DeliveryPropertiesData = {
                            delivery: this.tracingService.getDeliveriesById([edge.id()])[0]
                        };

                        this.dialogService
              .open(DeliveryPropertiesComponent, { data: dialogData })
              .afterClosed()
              .subscribe(() => this.updateOverlay());
                    }
                }
            },
            {
                name: 'Show Trace',
                enabled: true,
                toolTip: null,
                action: event => {
                    if (this.mergeMap.has(edge.id())) {
                        Utils.showErrorMessage(
              this.dialogService,
              'Showing Trace of merged delivery is not supported!'
            )
              .afterClosed()
              .subscribe(() => this.updateOverlay());
                    } else {
                        this.traceMenuActions = this.createTraceActions(edge);
                        Utils.openMenu(
              this.traceMenuTrigger,
              this.traceMenuTriggerElement,
              this.getCyCoordinates(event)
            );
                    }
                }
            }
        ];
    }

    protected createCollapseActions(): MenuAction[] {
        return [
            {
                name: 'Collapse Sources...',
                enabled: true,
                toolTip:
          'Collapse stations without incoming edges which have deliveries to the same station.',
                action: () => {
                    const options: {
                        value: string;
                        viewValue: string;
                        toolTip: string;
                    }[] = [];
                    options.push({
                        value: GroupMode.WEIGHT_ONLY.toString(),
                        viewValue: 'weight sensitive',
                        toolTip:
              // tslint:disable-next-line:max-line-length
              'Stations without incoming edges are collapsed iif they send their delivieres to the same station and either their weights are all positive or all zero.'
                    });
                    options.push({
                        value: GroupMode.PRODUCT_AND_WEIGHT.toString(),
                        viewValue: 'product name and weight sensitive',
                        toolTip:
              // tslint:disable-next-line:max-line-length
              'Stations without incoming edges are collapsed iif their outgoing delivieres go into the the same products of the same station and either their weights are all positive or all zero.'
                    });
                    options.push({
                        value: GroupMode.LOT_AND_WEIGHT.toString(),
                        viewValue: 'lot and weight sensitive',
                        toolTip:
              // tslint:disable-next-line:max-line-length
              'Stations without incoming edges are collapsed iif their outgoing delivieres go into the same lots of the same station and either their weights are all positive or all zero.'
                    });

          /*const dialogData: DialogPromptData = {
            title: 'Input',
            message: 'Please specify name of meta station:',
            placeholder: 'Name'
          };*/
                    const dialogData: DialogSingleSelectData = {
                        title: 'Choose source collapse mode',
                        message: '', // Choose collapse mode:',
                        options: options,
                        value: GroupMode.WEIGHT_ONLY.toString()
                    };

                    this.dialogService
            .open(DialogSingleSelectComponent, { data: dialogData })
            .afterClosed()
            .subscribe(groupMode => {
                this.updateOverlay();
                if (groupMode != null) {
                    this.tracingService.collapseSourceStations(groupMode);
                    this.updateAll();
                    this.callChangeFunction();
                }
            });
                }
            },
            {
                name: 'Collapse Targets...',
                enabled: true,
                toolTip:
          'Collapse stations without outgoing edges which receive their deliveries from the same station.',
                action: () => {
                    const options: {
                        value: string;
                        viewValue: string;
                        toolTip: string;
                    }[] = [];
                    options.push({
                        value: GroupMode.WEIGHT_ONLY.toString(),
                        viewValue: 'weight sensitive',
                        toolTip:
              // tslint:disable-next-line:max-line-length
              'Stations without outgoing edges are collapsed iif they get their delivieres from the same station and either their weights are all positive or all zero.'
                    });
                    options.push({
                        value: GroupMode.PRODUCT_AND_WEIGHT.toString(),
                        viewValue: 'product name and weight sensitive',
                        toolTip:
              // tslint:disable-next-line:max-line-length
              'Stations without outgoing edges are collapsed iif their incoming delivieres are all from the same product and either their weights are all positive or all zero.'
                    });
                    options.push({
                        value: GroupMode.LOT_AND_WEIGHT.toString(),
                        viewValue: 'lot and weight sensitive',
                        toolTip:
              // tslint:disable-next-line:max-line-length
              'Stations without outgoing edges are collapsed iif their incoming delivieres are all from the same lot and either their weights are all positive or all zero.'
                    });

                    const dialogData: DialogSingleSelectData = {
                        title: 'Choose target collapse mode',
                        message: '', // Choose collapse mode:',
                        options: options,
                        value: GroupMode.WEIGHT_ONLY.toString()
                    };

                    this.dialogService
            .open(DialogSingleSelectComponent, { data: dialogData })
            .afterClosed()
            .subscribe(groupMode => {
                this.updateOverlay();
                if (groupMode != null) {
                    this.tracingService.collapseTargetStations(groupMode);
                    this.updateAll();
                    this.callChangeFunction();
                }
            });
                }
            },
            {
                name: 'Collapse Simple Chains',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.updateOverlay();
                    this.tracingService.collapseSimpleChains();
                    this.updateAll();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Collapse Isolated Clouds',
                enabled: true,
                toolTip:
          'Collapse stations from which a weighted station or delivery cannot be reached.',
                action: () => {
                    this.updateOverlay();
                    this.tracingService.collapseIsolatedClouds();
                    this.updateAll();
                    this.callChangeFunction();
                }
            }
        ];
    }

    protected createUncollapseActions(): MenuAction[] {
        return [
            {
                name: 'Uncollapse Sources',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.tracingService.uncollapseSourceStations();
                    this.updateAll();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Uncollapse Targets',
                enabled: true,
                toolTip: null,
                action: () => {
                    this.tracingService.uncollapseTargetStations();
                    this.updateAll();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Uncollapse Simple Chains',
                enabled: true,
                toolTip: null,
                action: () => {
          // this.updateOverlay();
                    this.tracingService.uncollapseSimpleChains();
                    this.updateAll();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Uncollapse Isolated Clouds',
                enabled: true,
                toolTip: null,
                action: () => {
          // this.updateOverlay();
                    this.tracingService.uncollapseIsolatedClouds();
                    this.updateAll();
                    this.callChangeFunction();
                }
            }
        ];
    }

    private createLayoutActions(): MenuAction[] {
        return [
            {
                name: 'Fruchterman-Reingold',
                enabled: true,
                toolTip: null,
                action: () => this.cy.layout({ name: 'fruchterman' }).run()
            },
            {
                name: 'Farm-to-fork',
                enabled: true,
                toolTip: null,
                action: () =>
          this.cy
            .layout({
                name: 'farm_to_fork',
                options: { nodeSize: this.nodeSize }
            })
            .run()
            },
            {
                name: 'Constraint-Based',
                enabled: true,
                toolTip: null,
                action: () => {
                    let layout;
                    const layoutDialogData: DialogActionsData = {
                        title: 'Layout running',
                        actions: [{ name: 'Stop', action: () => layout.stop() }]
                    };
                    const layoutDialog = this.dialogService.open(DialogActionsComponent, {
                        disableClose: true,
                        data: layoutDialogData
                    });

                    layout = this.cy.layout({
                        name: 'cola',
                        ungrabifyWhileSimulating: true,
                        avoidOverlap: false,
                        animate: true,
                        maxSimulationTime: 60000,
                        stop: function () {
                            layoutDialog.close();
                        }
                    });
                    layout.run();
                }
            },
            {
                name: 'Random',
                enabled: true,
                toolTip: null,
                action: () => this.cy.layout({ name: 'random' }).run()
            },
            {
                name: 'Grid',
                enabled: true,
                toolTip: null,
                action: () => this.cy.layout({ name: 'grid' }).run()
            },
            {
                name: 'Circle',
                enabled: true,
                toolTip: null,
                action: () => this.cy.layout({ name: 'circle' }).run()
            },
            {
                name: 'Concentric',
                enabled: true,
                toolTip: null,
                action: () => this.cy.layout({ name: 'concentric' }).run()
            },
            {
                name: 'Breadth-first',
                enabled: true,
                toolTip: null,
                action: () => this.cy.layout({ name: 'breadthfirst' }).run()
            },
            {
                name: 'Spread',
                enabled: true,
                toolTip: null,
                action: () => this.cy.layout({ name: 'spread' }).run()
            },
            {
                name: 'Directed acyclic graph',
                enabled: true,
                toolTip: null,
                action: () => this.cy.layout({ name: 'dagre' }).run()
            }
        ];
    }

    private createTraceActions(element): MenuAction[] {
        return [
            {
                name: 'Forward Trace',
                enabled: true,
                toolTip: null,
                action: () => {
                    if (element.isNode()) {
                        this.tracingService.showStationForwardTrace(element.id());
                    } else if (element.isEdge()) {
                        this.tracingService.showDeliveryForwardTrace(element.id());
                    }

                    this.updateProperties();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Backward Trace',
                enabled: true,
                toolTip: null,
                action: () => {
                    if (element.isNode()) {
                        this.tracingService.showStationBackwardTrace(element.id());
                    } else if (element.isEdge()) {
                        this.tracingService.showDeliveryBackwardTrace(element.id());
                    }

                    this.updateProperties();
                    this.callChangeFunction();
                }
            },
            {
                name: 'Full Trace',
                enabled: true,
                toolTip: null,
                action: () => {
                    if (element.isNode()) {
                        this.tracingService.showStationTrace(element.id());
                    } else if (element.isEdge()) {
                        this.tracingService.showDeliveryTrace(element.id());
                    }

                    this.updateProperties();
                    this.callChangeFunction();
                }
            }
        ];
    }

    private callChangeFunction() {
        if (this.changeFunction != null) {
            this.changeFunction();
        }
    }

    private updateOverlay() {
        if (this.contextMenuElement != null) {
            const elementMenuOrDialogOpen =
        this.stationMenuTrigger.menuOpen ||
        this.deliveryMenuTrigger.menuOpen ||
        this.traceMenuTrigger.menuOpen ||
        this.dialogService.openDialogs.length !== 0;

            this.contextMenuElement.scratch('_active', elementMenuOrDialogOpen);
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

    private updateSlider() {
        this.zoomSliderValue = Math.round(
      (Math.log(this.cy.zoom() / this.cy.minZoom()) /
        Math.log(this.cy.maxZoom() / this.cy.minZoom())) *
        100
    );
    }

    private getCyCoordinates(event: MouseEvent): Position {
        const cyRect = this.cy.container().getBoundingClientRect();

        return {
            x: event.pageX - cyRect.left,
            y: event.pageY - cyRect.top
        };
    }
}
