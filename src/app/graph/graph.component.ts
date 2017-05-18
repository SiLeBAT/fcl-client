import {Component, OnInit, ViewChild} from '@angular/core';
import {MdDialog, MdMenuTrigger} from '@angular/material';
import {Observable, Subject} from 'rxjs/Rx';
import cytoscape from 'cytoscape';
import cola from 'cytoscape-cola';
import dagre from 'cytoscape-dagre';
import spread from 'cytoscape-spread';
import html2canvas from 'html2canvas';
import {ResizeSensor} from 'css-element-queries';

import {DialogActionsComponent, DialogActionsData} from '../dialog/dialog-actions/dialog-actions.component';
import {DialogPromptComponent, DialogPromptData} from '../dialog/dialog-prompt/dialog-prompt.component';
import {StationPropertiesComponent, StationPropertiesData} from '../dialog/station-properties/station-properties.component';
import {DeliveryPropertiesComponent, DeliveryPropertiesData} from '../dialog/delivery-properties/delivery-properties.component';
import {Utils} from '../util/utils';
import {TracingService} from './tracing.service';
import {CyEdge, CyNode, DeliveryData, FclElements, ObservedType, Position, Size, StationData} from '../util/datatypes';
import {FruchtermanLayout} from './fruchterman_reingold';
import {Legend} from './legend';
import {Zooming} from './zooming';
import {Constants} from '../util/constants';

interface MenuAction {
  name: string;
  enabled: boolean;
  action: (event: MouseEvent) => void;
}

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {

  private static NODE_SIZES: Map<Size, number> = new Map([
    [Size.SMALL, 50],
    [Size.MEDIUM, 75],
    [Size.LARGE, 100]
  ]);

  private static FONT_SIZES: Map<Size, number> = new Map([
    [Size.SMALL, 10],
    [Size.MEDIUM, 14],
    [Size.LARGE, 18]
  ]);

  @ViewChild('graphMenuTrigger') graphMenuTrigger: MdMenuTrigger;
  @ViewChild('stationMenuTrigger') stationMenuTrigger: MdMenuTrigger;
  @ViewChild('deliveryMenuTrigger') deliveryMenuTrigger: MdMenuTrigger;
  @ViewChild('layoutMenuTrigger') layoutMenuTrigger: MdMenuTrigger;
  @ViewChild('traceMenuTrigger') traceMenuTrigger: MdMenuTrigger;

  graphMenuActions = this.createGraphActions();
  stationMenuActions = this.createStationActions(null);
  deliveryMenuActions = this.createDeliveryActions(null);
  layoutMenuActions = this.createLayoutActions();
  traceMenuActions = this.createTraceActions(null);

  private cy: any;
  private data: FclElements;
  private mergeMap: Map<string, string[]>;
  private mergeToMap: Map<string, string>;
  private changeFunction: () => void;

  private mergeDeliveries = Constants.DEFAULT_GRAPH_MERGE_DELIVERIES;
  private nodeSize = Constants.DEFAULT_GRAPH_NODE_SIZE;
  private fontSize = Constants.DEFAULT_GRAPH_FONT_SIZE;
  private showLegend = Constants.DEFAULT_GRAPH_SHOW_LEGEND;

  private overlay: Set<string> = new Set();
  private contextMenuElement: any;
  private selectTimerActivated = true;
  private resizeTimer: any;
  private selectTimer: any;
  private zoom: Subject<boolean> = new Subject();
  private legend: Subject<string[]> = new Subject();
  private hoverDeliveries: Subject<string[]> = new Subject();
  private hoverableEdges: any;

  private static getCyCoordinates(event: MouseEvent): Position {
    const cyRect = document.getElementById('cy').getBoundingClientRect();

    return {
      x: event.pageX - cyRect.left,
      y: event.pageY - cyRect.top
    };
  }

  constructor(private tracingService: TracingService, private dialogService: MdDialog) {
    if (cytoscape != null) {
      cytoscape.use(cola);
      cytoscape.use(dagre);
      cytoscape.use(spread);
      cytoscape('core', 'legend', Legend);
      cytoscape('core', 'zooming', Zooming);
      cytoscape('layout', 'fruchterman', FruchtermanLayout);
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

    new ResizeSensor(document.getElementById('graphContainer'), () => {
      if (this.resizeTimer != null) {
        this.resizeTimer.unsubscribe();
      }

      if (this.cy != null) {
        this.resizeTimer = Observable.timer(100).subscribe(() => this.cy.resize());
      }
    });

    this.stationMenuTrigger.onMenuOpen.subscribe(() => this.setOverlay(this.contextMenuElement, true));
    this.stationMenuTrigger.onMenuClose.subscribe(() => {
      if (!this.traceMenuTrigger.menuOpen && this.dialogService._openDialogs.length === 0) {
        this.setOverlay(this.contextMenuElement, false);
      }
    });
    this.deliveryMenuTrigger.onMenuOpen.subscribe(() => this.setOverlay(this.contextMenuElement, true));
    this.deliveryMenuTrigger.onMenuClose.subscribe(() => {
      if (!this.traceMenuTrigger.menuOpen && this.dialogService._openDialogs.length === 0) {
        this.setOverlay(this.contextMenuElement, false);
      }
    });
    this.traceMenuTrigger.onMenuOpen.subscribe(() => this.setOverlay(this.contextMenuElement, true));
    this.traceMenuTrigger.onMenuClose.subscribe(() => this.setOverlay(this.contextMenuElement, false));
  }

  init(data: FclElements, layout: any) {
    this.data = data;
    this.tracingService.init(data);

    this.cy = cytoscape({
      container: document.getElementById('cy'),

      elements: {
        nodes: this.createNodes(),
        edges: this.createEdges()
      },

      layout: layout,
      style: this.createStyle(),
      minZoom: 0.01,
      maxZoom: 10,
      wheelSensitivity: 0.5,
    });

    this.cy.zooming(this.zoom);
    this.cy.legend(this.legend);
    this.cy.on('zoom', () => this.setFontSize(this.fontSize));
    this.cy.on('select', event => this.setSelected(event.target.id(), true));
    this.cy.on('unselect', event => this.setSelected(event.target.id(), false));
    this.cy.on('position', event => this.tracingService.getStationsById([event.target.id()])[0].position = event.target.position());
    this.cy.on('cxttap', event => {
      const element = event.target;
      const position: Position = {
        x: event.originalEvent.offsetX,
        y: event.originalEvent.offsetY
      };

      if (element === this.cy) {
        Utils.setElementPosition(document.getElementById('graphMenu'), position);
        this.graphMenuTrigger.openMenu();
      } else if (element.isNode()) {
        this.contextMenuElement = element;
        this.stationMenuActions = this.createStationActions(element);
        Utils.setElementPosition(document.getElementById('stationMenu'), position);
        this.stationMenuTrigger.openMenu();
      } else if (element.isEdge()) {
        this.contextMenuElement = element;
        this.deliveryMenuActions = this.createDeliveryActions(element);
        Utils.setElementPosition(document.getElementById('deliveryMenu'), position);
        this.deliveryMenuTrigger.openMenu();
      }
    });
    this.hoverDeliveries.subscribe(ids => {
      this.cy.batch(() => {
        this.setOverlay(this.hoverableEdges, false);

        for (const id of ids) {
          this.setOverlay(this.cy.getElementById(this.mergeToMap.has(id) ? this.mergeToMap.get(id) : id), true);
        }
      });
    });

    this.setFontSize(this.fontSize);
    this.setShowLegend(this.showLegend);

    for (const s of data.stations) {
      const pos = this.cy.nodes().getElementById(s.id).position();

      if (pos != null) {
        s.position = pos;
      }
    }
  }

  onChange(changeFunction: () => void) {
    this.changeFunction = changeFunction;
  }

  getLayout(): any {
    return {
      name: 'preset',
      zoom: this.cy.zoom(),
      pan: this.cy.pan()
    };
  }

  getCanvas(): Promise<HTMLCanvasElement> {
    return new Promise(resolve => {
      this.zoom.next(false);
      //noinspection JSUnusedGlobalSymbols
      html2canvas(document.getElementById('graphContainer'), {
        onrendered: (canvas) => {
          this.zoom.next(true);
          resolve(canvas);
        }
      });
    });
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

    if (this.cy != null) {
      this.legend.next(showLegend ? Constants.PROPERTIES_WITH_COLORS.toArray() : []);
    }
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
    for (const s of this.data.stations) {
      if (!s.contained && s.positionRelativeTo != null) {
        s.position = Utils.sum(this.cy.nodes().getElementById(s.positionRelativeTo).position(), s.position);
      } else if (s.position == null && s.contains != null) {
        s.position = Utils.getCenter(s.contains.map(id => this.tracingService.getStationsById([id])[0].position));

        for (const contained of this.tracingService.getStationsById(s.contains)) {
          contained.positionRelativeTo = s.id;
          contained.position = Utils.difference(contained.position, s.position);
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

  private createStyle(): any {
    const sizeFunction = node => {
      const size = GraphComponent.NODE_SIZES.get(this.nodeSize);

      if (this.tracingService.getMaxScore() > 0) {
        return (0.5 + 0.5 * node.data('score') / this.tracingService.getMaxScore()) * size;
      } else {
        return size;
      }
    };

    let style = cytoscape.stylesheet()
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
        'color': 'rgb(0, 0, 0)',
        'font-family': 'Roboto, Helvetica Neue, sans-serif',
        'overlay-color': 'rgb(0, 0, 255)',
        'overlay-padding': 10
      })
      .selector('edge')
      .style({
        'target-arrow-shape': 'triangle',
        'width': 6,
        'line-color': 'rgb(0, 0, 0)',
        'target-arrow-color': 'rgb(255, 0, 0)',
        'curve-style': 'bezier',
        'overlay-color': 'rgb(0, 0, 255)',
        'overlay-padding': 10
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
      });

    const createSelector = (prop: string) => {
      if (prop === 'observed') {
        return '[' + prop + ' != "' + ObservedType.NONE + '"]';
      } else {
        return '[?' + prop + ']';
      }
    };

    const createNodeBackground = (colors: number[][]) => {
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
        c2.push(Utils.mixColors(color, [0, 0, 255]));
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
        name: 'Apply Layout',
        enabled: true,
        action: event => {
          Utils.setElementPosition(document.getElementById('layoutMenu'), GraphComponent.getCyCoordinates(event));
          this.layoutMenuTrigger.openMenu();
        }
      }, {
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
    let allNonMetaStations = false;

    if (this.cy != null && node != null) {
      selectedNodes = this.cy.nodes(':selected');
      multipleStationsSelected = node.selected() && selectedNodes.size() > 1;
      allOutbreakStations = multipleStationsSelected ? selectedNodes.allAre('[?outbreak]') : node.data('outbreak');
      allCrossContaminationStations = multipleStationsSelected ? selectedNodes.allAre('[?crossContamination]') :
        node.data('crossContamination');
      allMetaStations = multipleStationsSelected ? selectedNodes.allAre('[?contains]') : node.data('contains');
      allNonMetaStations = multipleStationsSelected ? !selectedNodes.is('[?contains]') : !node.data('contains');
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
          this.setOverlay(node, true);
          this.dialogService.open(StationPropertiesComponent, {data: dialogData}).afterClosed().subscribe(connections => {
            this.setOverlay(node, false);

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
          Utils.setElementPosition(document.getElementById('traceMenu'), GraphComponent.getCyCoordinates(event));
          this.traceMenuTrigger.openMenu();
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
          if (allNonMetaStations) {
            const dialogData: DialogPromptData = {
              title: 'Input',
              message: 'Please specify name of meta station:',
              placeholder: 'Name'
            };

            this.dialogService.open(DialogPromptComponent, {data: dialogData}).afterClosed().subscribe(name => {
              if (name != null) {
                this.tracingService.mergeStations(selectedNodes.map(s => s.id()), name);
                this.updateAll();
                this.callChangeFunction();
              }
            });
          } else {
            Utils.showErrorMessage(this.dialogService, 'Merging is only provided for non-meta stations!');
          }
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
        action: (event) => {
          console.log(event);

          if (this.mergeMap.has(edge.id())) {
            Utils.showErrorMessage(this.dialogService, 'Showing Properties of merged delivery is not supported!');
          } else {
            const dialogData: DeliveryPropertiesData = {
              delivery: this.tracingService.getDeliveriesById([edge.id()])[0]
            };

            this.setOverlay(edge, true);
            this.dialogService.open(DeliveryPropertiesComponent, {data: dialogData}).afterClosed()
              .subscribe(() => this.setOverlay(edge, false));
          }
        }
      }, {
        name: 'Show Trace',
        enabled: true,
        action: event => {
          this.traceMenuActions = this.createTraceActions(edge);
          Utils.setElementPosition(document.getElementById('traceMenu'), GraphComponent.getCyCoordinates(event));
          this.traceMenuTrigger.openMenu();
        }
      }
    ];
  }

  private createLayoutActions(): MenuAction[] {
    return [
      {
        name: 'Fruchterman-Reingold',
        enabled: true,
        action: () => this.cy.layout({name: 'fruchterman'}).run()
      }, {
        name: 'Constraint-Based',
        enabled: true,
        action: () => {
          let layout;
          const layoutDialogData: DialogActionsData = {
            title: 'Layout running',
            actions: [{name: 'Stop', action: () => layout.stop()}]
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
      }, {
        name: 'Random',
        enabled: true,
        action: () => this.cy.layout({name: 'random'}).run()
      }, {
        name: 'Grid',
        enabled: true,
        action: () => this.cy.layout({name: 'grid'}).run()
      }, {
        name: 'Circle',
        enabled: true,
        action: () => this.cy.layout({name: 'circle'}).run()
      }, {
        name: 'Concentric',
        enabled: true,
        action: () => this.cy.layout({name: 'concentric'}).run()
      }, {
        name: 'Breadth-first',
        enabled: true,
        action: () => this.cy.layout({name: 'breadthfirst'}).run()
      }, {
        name: 'Spread',
        enabled: true,
        action: () => this.cy.layout({name: 'spread'}).run()
      }, {
        name: 'Directed acyclic graph',
        enabled: true,
        action: () => this.cy.layout({name: 'dagre'}).run()
      }
    ];
  }

  private createTraceActions(element): MenuAction[] {
    return [
      {
        name: 'Forward Trace',
        enabled: true,
        action: () => {
          if (this.mergeMap.has(element.id())) {
            Utils.showErrorMessage(this.dialogService, 'Showing Trace of merged delivery is not supported!');
          } else {
            if (element.isNode()) {
              this.tracingService.showStationForwardTrace(element.id());
            } else if (element.isEdge()) {
              this.tracingService.showDeliveryForwardTrace(element.id());
            }

            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }, {
        name: 'Backward Trace',
        enabled: true,
        action: () => {
          if (this.mergeMap.has(element.id())) {
            Utils.showErrorMessage(this.dialogService, 'Showing Trace of merged delivery is not supported!');
          } else {
            if (element.isNode()) {
              this.tracingService.showStationBackwardTrace(element.id());
            } else if (element.isEdge()) {
              this.tracingService.showDeliveryBackwardTrace(element.id());
            }

            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }, {
        name: 'Full Trace',
        enabled: true,
        action: () => {
          if (this.mergeMap.has(element.id())) {
            Utils.showErrorMessage(this.dialogService, 'Showing Trace of merged delivery is not supported!');
          } else {
            if (element.isNode()) {
              this.tracingService.showStationTrace(element.id());
            } else if (element.isEdge()) {
              this.tracingService.showDeliveryTrace(element.id());
            }

            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }
    ];
  }

  private setOverlay(elements, enabled: boolean) {
    elements.forEach(e => {
      if (this.overlay.has(e.id())) {
        if (!enabled) {
          this.overlay.delete(e.id());
          e.style({'overlay-opacity': 0});
        }
      } else {
        if (enabled) {
          this.overlay.add(e.id());
          e.style({'overlay-opacity': 0.5});
        }
      }
    });
  }

  private callChangeFunction() {
    if (this.changeFunction != null) {
      this.changeFunction();
    }
  }

}
