import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {MdDialog, MdMenuTrigger, MdSlider} from '@angular/material';
import {Observable, Subject} from 'rxjs/Rx';
import * as ol from 'openlayers';
import cytoscape from 'cytoscape';
import html2canvas from 'html2canvas';
import {ResizeSensor} from 'css-element-queries';

import {DialogPromptComponent, DialogPromptData} from '../dialog/dialog-prompt/dialog-prompt.component';
import {StationPropertiesComponent, StationPropertiesData} from '../dialog/station-properties/station-properties.component';
import {DeliveryPropertiesComponent, DeliveryPropertiesData} from '../dialog/delivery-properties/delivery-properties.component';
import {Utils} from '../util/utils';
import {TracingService} from '../tracing/tracing.service';
import {Color, CyEdge, CyNode, DeliveryData, FclElements, Layout, ObservedType, Position, Size, StationData} from '../util/datatypes';
import {Constants} from '../util/constants';

interface MenuAction {
  name: string;
  enabled: boolean;
  action: (event: MouseEvent) => void;
}

@Component({
  selector: 'app-gis',
  templateUrl: './gis.component.html',
  styleUrls: ['./gis.component.css']
})
export class GisComponent implements OnInit {

  private static readonly MIN_ZOOM = 0.1;
  private static readonly MAX_ZOOM = 100.0;
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
  @ViewChild('map') mapElement: ElementRef;
  @ViewChild('graph') graphElement: ElementRef;

  @ViewChild('slider') slider: MdSlider;
  @ViewChild('graphMenuTrigger') graphMenuTrigger: MdMenuTrigger;
  @ViewChild('stationMenuTrigger') stationMenuTrigger: MdMenuTrigger;
  @ViewChild('deliveryMenuTrigger') deliveryMenuTrigger: MdMenuTrigger;
  @ViewChild('traceMenuTrigger') traceMenuTrigger: MdMenuTrigger;

  graphMenuActions = this.createGraphActions();
  stationMenuActions = this.createStationActions(null);
  deliveryMenuActions = this.createDeliveryActions(null);
  traceMenuActions = this.createTraceActions(null);

  showZoom = Constants.DEFAULT_GRAPH_SHOW_ZOOM;
  showLegend = Constants.DEFAULT_GRAPH_SHOW_LEGEND;
  legend: { name: string; color: string }[] = Constants.PROPERTIES_WITH_COLORS.toArray().map(p => {
    const prop = Constants.PROPERTIES.get(p);

    return {
      name: prop.name,
      color: Utils.colorToCss(prop.color)
    };
  });
  zoomSliderValue: number;

  private zoom = 5.0;
  private sliding = false;

  private cy: any;
  private map: ol.Map;
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

  constructor(private tracingService: TracingService, private dialogService: MdDialog) {
  }

  ngOnInit() {
    this.map = new ol.Map({
      target: this.mapElement.nativeElement,
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      controls: []
    });

    window.onresize = () => {
      Observable.timer(500).subscribe(() => {
        if (this.cy != null) {
          this.resizeGraphAndMap();
        }
      });
    };

    new ResizeSensor(this.containerElement.nativeElement, () => {
      if (this.resizeTimer != null) {
        this.resizeTimer.unsubscribe();
      }

      if (this.cy != null) {
        this.resizeTimer = Observable.timer(100).subscribe(() => this.resizeGraphAndMap());
      }
    });

    this.stationMenuTrigger.onMenuOpen.subscribe(() => this.updateOverlay());
    this.stationMenuTrigger.onMenuClose.subscribe(() => this.updateOverlay());
    this.deliveryMenuTrigger.onMenuOpen.subscribe(() => this.updateOverlay());
    this.deliveryMenuTrigger.onMenuClose.subscribe(() => this.updateOverlay());
    this.traceMenuTrigger.onMenuClose.subscribe(() => this.updateOverlay());
  }

  init(data: FclElements, layout: Layout) {
    this.data = data;
    this.tracingService.init(data);


    let pan: Position;

    if (layout != null) {
      this.zoom = layout.zoom;
      pan = layout.pan;
    }

    const nodes = this.createNodes();

    if (pan == null) {
      pan = {x: Infinity, y: Infinity};

      for (const n of nodes) {
        pan.x = Math.min(pan.x, n.position.x);
        pan.y = Math.min(pan.y, n.position.y);
      }

      pan.x = -pan.x;
      pan.y = -pan.y;
    }

    this.cy = cytoscape({
      container: this.graphElement.nativeElement,

      elements: {
        nodes: nodes,
        edges: this.createEdges()
      },

      layout: {name: 'preset', zoom: 1, pan: pan},
      style: this.createStyle(),
      zoomingEnabled: false,
      autoungrabify: true
    });

    const hammer = new Hammer.Manager(this.cy.container().children.item(0).children.item(0));
    let pinchCenter: Position;

    hammer.add(new Hammer.Pinch());
    hammer.on('pinch', e => {
      this.cy.userPanningEnabled(false);

      if (pinchCenter == null) {
        const cyRect = this.cy.container().getBoundingClientRect();

        pinchCenter = {
          x: e.center.x - cyRect.left,
          y: e.center.y - cyRect.top
        };
      }

      this.zoomTo(this.zoom * Math.pow(10, Math.log10(e.scale) / 10), pinchCenter.x, pinchCenter.y);
    });
    hammer.on('pinchend', () => {
      pinchCenter = null;
      this.cy.userPanningEnabled(true);
    });
    this.cy.container().children.item(0).children.item(0).addEventListener('wheel', (e: WheelEvent) => {
      this.zoomTo(this.zoom * Math.pow(10, e.deltaMode === 1 ? e.deltaY / -25 : e.deltaY / -250), e.offsetX, e.offsetY);
    }, false);

    this.cy.on('pan', () => this.map.setView(Utils.panZoomToView(this.cy.pan(), this.zoom, this.cy.width(), this.cy.height())));
    this.cy.on('select', event => this.setSelected(event.target.id(), true));
    this.cy.on('unselect', event => this.setSelected(event.target.id(), false));
    this.cy.on('cxttap', event => {
      const element = event.target;
      const position: Position = {
        x: event.originalEvent.offsetX,
        y: event.originalEvent.offsetY
      };

      if (element === this.cy) {
        this.contextMenuElement = null;
        Utils.openMenu(this.graphMenuTrigger, position);
      } else if (element.isNode()) {
        this.contextMenuElement = element;
        this.stationMenuActions = this.createStationActions(element);
        Utils.openMenu(this.stationMenuTrigger, position);
      } else if (element.isEdge()) {
        this.contextMenuElement = element;
        this.deliveryMenuActions = this.createDeliveryActions(element);
        Utils.openMenu(this.deliveryMenuTrigger, position);
      }
    });
    this.hoverDeliveries.subscribe(ids => {
      const idSet: Set<string> = new Set();

      for (const id of ids) {
        idSet.add(this.mergeToMap.has(id) ? this.mergeToMap.get(id) : id);
      }

      this.cy.batch(() => {
        this.hoverableEdges.filter(e => !idSet.has(e.id())).scratch('_active', false);
        this.hoverableEdges.filter(e => idSet.has(e.id())).scratch('_active', true);
      });
    });

    this.setFontSize(this.fontSize);
    this.setShowLegend(this.showLegend);
    this.updateSlider();
    this.map.setView(Utils.panZoomToView(this.cy.pan(), this.zoom, this.cy.width(), this.cy.height()));
  }

  //noinspection JSUnusedGlobalSymbols
  onChange(changeFunction: () => void) {
    this.changeFunction = changeFunction;
  }

  getLayout(): Layout {
    if (this.cy != null) {
      return {
        zoom: this.zoom,
        pan: this.cy.pan()
      };
    } else {
      return null;
    }
  }

  //noinspection JSUnusedGlobalSymbols
  getCanvas(): Promise<HTMLCanvasElement> {
    return new Promise(resolve => {
      //noinspection JSUnusedGlobalSymbols
      html2canvas(this.containerElement.nativeElement, {
        onrendered: (canvas) => {
          resolve(canvas);
        }
      });
    });
  }

  //noinspection JSUnusedGlobalSymbols
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
      this.cy.nodes().style({
        'font-size': GisComponent.FONT_SIZES.get(fontSize)
      });
    }
  }

  setShowLegend(showLegend: boolean) {
    this.showLegend = showLegend;
  }

  //noinspection JSUnusedGlobalSymbols
  setShowZoom(showZoom: boolean) {
    this.showZoom = showZoom;
  }

  //noinspection JSUnusedGlobalSymbols
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
    this.zoomTo(this.zoom * GisComponent.ZOOM_FACTOR, this.cy.width() / 2, this.cy.height() / 2);
  }

  zoomOutPressed() {
    this.zoomTo(this.zoom / GisComponent.ZOOM_FACTOR, this.cy.width() / 2, this.cy.height() / 2);
  }

  zoomResetPressed() {
    // TODO
  }

  sliderChanged() {
    const newZoom = Math.exp(this.slider.value / 100 * Math.log(GisComponent.MAX_ZOOM / GisComponent.MIN_ZOOM)) * GisComponent.MIN_ZOOM;

    this.sliding = true;
    this.zoomTo(newZoom, this.cy.width() / 2, this.cy.height() / 2);
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
          position: Utils.latLonToPosition(s.lat, s.lon, this.zoom)
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
            selected: value[0].selected,
          });
        } else {
          const observedElement = value.find(d => d.observed !== ObservedType.NONE);
          const selected = value.find(d => d.selected) != null;

          value.forEach(d => this.mergeToMap.set(d.id, key));
          this.mergeMap.set(key, value.map(d => d.id));
          edges.push({
            group: 'edges',
            data: {
              id: key,
              name: key,
              lot: null,
              date: null,
              source: value[0].source,
              target: value[0].target,
              originalSource: value[0].source,
              originalTarget: value[0].target,
              invisible: false,
              selected: selected,
              observed: observedElement != null ? observedElement.observed : ObservedType.NONE,
              forward: value.find(d => d.forward) != null,
              backward: value.find(d => d.backward) != null,
              score: 0,
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
            selected: d.selected,
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
    if (this.mergeDeliveries) {
      this.updateEdges();
      this.cy.nodes().scratch('_update', true);
    } else {
      this.cy.elements().scratch('_update', true);
    }
  }

  private updateAll() {
    this.cy.batch(() => {
      this.cy.elements().remove();
      this.cy.add(this.createNodes());
      this.cy.add(this.createEdges());
      this.setFontSize(this.fontSize);
    });
  }

  private createStyle(): any {
    const sizeFunction = node => {
      const size = GisComponent.NODE_SIZES.get(this.nodeSize);

      if (this.tracingService.getMaxScore() > 0) {
        return (0.5 + 0.5 * node.data('score') / this.tracingService.getMaxScore()) * size;
      } else {
        return size;
      }
    };

    let style = cytoscape.stylesheet()
      .selector('*')
      .style({
        'overlay-color': 'rgb(0, 0, 255)',
        'overlay-padding': 10,
        'overlay-opacity': e => e.scratch('_active') ? 0.5 : 0.0
      })
      .selector('node')
      .style({
        'content': 'data(name)',
        'height': sizeFunction,
        'width': sizeFunction,
        'background-color': 'rgb(255, 255, 255)',
        'border-width': 3,
        'border-color': 'rgb(0, 0, 0)',
        'text-valign': 'bottom',
        'text-halign': 'right',
        'color': 'rgb(0, 0, 0)'
      })
      .selector('edge')
      .style({
        'target-arrow-shape': 'triangle',
        'width': 6,
        'line-color': 'rgb(0, 0, 0)',
        'target-arrow-color': 'rgb(255, 0, 0)',
        'curve-style': 'bezier'
      })
      .selector('node:selected')
      .style({
        'background-color': 'rgb(128, 128, 255)',
        'border-width': 6,
        'border-color': 'rgb(0, 0, 255)',
        'color': 'rgb(0, 0, 255)'
      })
      .selector('edge:selected')
      .style({
        'width': 12
      })
      .selector('node[?contains]')
      .style({
        'border-width': 6
      })
      .selector('node:selected[?contains]')
      .style({
        'border-width': 9
      }).selector(':active')
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
          background['pie-' + (i + 1) + '-background-color'] = Utils.colorToCss(colors[i]);
          background['pie-' + (i + 1) + '-background-size'] = 100 / colors.length;
        }
      }

      return background;
    };

    for (const combination of Utils.getAllCombinations(Constants.PROPERTIES_WITH_COLORS.toArray())) {
      const s = [];
      const c1 = [];
      const c2 = [];

      for (const prop of combination) {
        const color = Constants.PROPERTIES.get(prop).color;

        s.push(createSelector(prop));
        c1.push(color);
        c2.push(Utils.mixColors(color, {r: 0, g: 0, b: 255}));
      }

      style = style.selector('node' + s.join('')).style(createNodeBackground(c1));
      style = style.selector('node:selected' + s.join('')).style(createNodeBackground(c2));
    }

    for (const prop of Constants.PROPERTIES_WITH_COLORS.toArray()) {
      style = style.selector('edge' + createSelector(prop)).style({
        'line-color': Utils.colorToCss(Constants.PROPERTIES.get(prop).color)
      });
    }

    return style;
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

      this.selectTimer = Observable.timer(50).subscribe(() => this.callChangeFunction());
    }
  }

  private createGraphActions(): MenuAction[] {
    return [
      {
        name: 'Clear Trace',
        enabled: true,
        action: () => {
          this.tracingService.clearTrace();
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Clear Outbreak Stations',
        enabled: true,
        action: () => {
          this.tracingService.clearOutbreakStations();
          this.setNodeSize(this.nodeSize);
          this.callChangeFunction();
        }
      }, {
        name: 'Clear Invisibility',
        enabled: true,
        action: () => {
          this.tracingService.clearInvisibility();
          this.updateAll();
          this.callChangeFunction();
        }
      }
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
      allOutbreakStations = multipleStationsSelected ? selectedNodes.allAre('[?outbreak]') : node.data('outbreak');
      allCrossContaminationStations = multipleStationsSelected ? selectedNodes.allAre('[?crossContamination]') :
        node.data('crossContamination');
      allMetaStations = multipleStationsSelected ? selectedNodes.allAre('[?contains]') : node.data('contains');
    }

    return [
      {
        name: 'Show Properties',
        enabled: !multipleStationsSelected,
        action: () => {
          const station = this.tracingService.getStationsById([node.id()])[0];
          const deliveries: Map<string, DeliveryData> = new Map();
          const connectedStations: Map<string, StationData> = new Map();

          for (const d of this.tracingService.getDeliveriesById(station.incoming)) {
            deliveries.set(d.id, d);
            connectedStations.set(d.source, this.tracingService.getStationsById([d.source])[0]);
          }

          for (const d of this.tracingService.getDeliveriesById(station.outgoing)) {
            deliveries.set(d.id, d);
            connectedStations.set(d.target, this.tracingService.getStationsById([d.target])[0]);
          }

          const dialogData: StationPropertiesData = {
            station: station,
            deliveries: deliveries,
            connectedStations: connectedStations,
            hoverDeliveries: this.hoverDeliveries
          };

          this.hoverableEdges = node.connectedEdges();
          this.dialogService.open(StationPropertiesComponent, {data: dialogData}).afterClosed().subscribe(connections => {
            this.updateOverlay();

            if (connections) {
              this.tracingService.setConnectionsOfStation(node.id(), connections);
              this.updateProperties();
            }
          });
        }
      }, {
        name: 'Show Trace',
        enabled: !multipleStationsSelected,
        action: event => {
          this.traceMenuActions = this.createTraceActions(node);
          Utils.openMenu(this.traceMenuTrigger, this.getCyCoordinates(event));
        }
      }, {
        name: allOutbreakStations ? 'Unmark as Outbreak' : 'Mark as Outbreak',
        enabled: true,
        action: () => {
          this.tracingService
            .markStationsAsOutbreak(multipleStationsSelected ? selectedNodes.map(s => s.id()) : [node.id()], !allOutbreakStations);
          this.setNodeSize(this.nodeSize);
          this.callChangeFunction();
        }
      }, {
        name: allCrossContaminationStations ? 'Unset Cross Contamination' : 'Set Cross Contamination',
        enabled: true,
        action: () => {
          this.tracingService.setCrossContaminationOfStations(
            multipleStationsSelected ? selectedNodes.map(s => s.id()) : [node.id()],
            !allCrossContaminationStations
          );
          this.updateProperties();
          this.setNodeSize(this.nodeSize);
          this.callChangeFunction();
        }
      }, {
        name: 'Make Invisible',
        enabled: true,
        action: () => {
          this.tracingService.makeStationsInvisible(multipleStationsSelected ? selectedNodes.map(s => s.id()) : [node.id()]);
          this.updateAll();
          this.callChangeFunction();
        }
      }, {
        name: 'Merge Stations',
        enabled: multipleStationsSelected,
        action: () => {
          const dialogData: DialogPromptData = {
            title: 'Input',
            message: 'Please specify name of meta station:',
            placeholder: 'Name'
          };

          this.dialogService.open(DialogPromptComponent, {data: dialogData}).afterClosed().subscribe(name => {
            this.updateOverlay();

            if (name != null) {
              this.tracingService.mergeStations(selectedNodes.map(s => s.id()), name);
              this.updateAll();
              this.callChangeFunction();
            }
          });
        }
      }, {
        name: 'Expand',
        enabled: allMetaStations,
        action: () => {
          this.tracingService.expandStations(multipleStationsSelected ? selectedNodes.map(s => s.id()) : node.id());
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
        action: () => {
          if (this.mergeMap.has(edge.id())) {
            Utils.showErrorMessage(this.dialogService, 'Showing Properties of merged delivery is not supported!').afterClosed()
              .subscribe(() => this.updateOverlay());
          } else {
            const dialogData: DeliveryPropertiesData = {
              delivery: this.tracingService.getDeliveriesById([edge.id()])[0]
            };

            this.dialogService.open(DeliveryPropertiesComponent, {data: dialogData}).afterClosed()
              .subscribe(() => this.updateOverlay());
          }
        }
      }, {
        name: 'Show Trace',
        enabled: true,
        action: event => {
          if (this.mergeMap.has(edge.id())) {
            Utils.showErrorMessage(this.dialogService, 'Showing Trace of merged delivery is not supported!').afterClosed()
              .subscribe(() => this.updateOverlay());
          } else {
            this.traceMenuActions = this.createTraceActions(edge);
            Utils.openMenu(this.traceMenuTrigger, this.getCyCoordinates(event));
          }
        }
      }
    ];
  }

  private createTraceActions(element): MenuAction[] {
    return [
      {
        name: 'Forward Trace',
        enabled: true,
        action: () => {
          if (element.isNode()) {
            this.tracingService.showStationForwardTrace(element.id());
          } else if (element.isEdge()) {
            this.tracingService.showDeliveryForwardTrace(element.id());
          }

          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Backward Trace',
        enabled: true,
        action: () => {
          if (element.isNode()) {
            this.tracingService.showStationBackwardTrace(element.id());
          } else if (element.isEdge()) {
            this.tracingService.showDeliveryBackwardTrace(element.id());
          }

          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Full Trace',
        enabled: true,
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
        this.dialogService._openDialogs.length !== 0;

      this.contextMenuElement.scratch('_active', elementMenuOrDialogOpen);
    }
  }

  private zoomTo(newZoom: number, zx: number, zy: number) {
    newZoom = Math.min(Math.max(newZoom, GisComponent.MIN_ZOOM), GisComponent.MAX_ZOOM);

    if (newZoom !== this.zoom) {
      this.cy.batch(() => {
        this.cy.pan({x: zx + (this.cy.pan().x - zx) * newZoom / this.zoom, y: zy + (this.cy.pan().y - zy) * newZoom / this.zoom});
        this.zoom = newZoom;
        this.cy.nodes().positions(node => Utils.latLonToPosition(node.data('lat'), node.data('lon'), newZoom));
      });
      this.map.setView(Utils.panZoomToView(this.cy.pan(), this.zoom, this.cy.width(), this.cy.height()));

      if (!this.sliding) {
        this.updateSlider();
      }
    }
  }

  private updateSlider() {
    this.zoomSliderValue =
      Math.round(Math.log(this.zoom / GisComponent.MIN_ZOOM) / Math.log(GisComponent.MAX_ZOOM / GisComponent.MIN_ZOOM) * 100);
  }

  private getCyCoordinates(event: MouseEvent): Position {
    const cyRect = this.cy.container().getBoundingClientRect();

    return {
      x: event.pageX - cyRect.left,
      y: event.pageY - cyRect.top
    };
  }

  private resizeGraphAndMap() {
    this.cy.resize();
    this.map.updateSize();
    this.map.setView(Utils.panZoomToView(this.cy.pan(), this.zoom, this.cy.width(), this.cy.height()));
  }
}
