import {Component, OnInit, ViewChild} from '@angular/core';
import {MdDialog, MdMenuTrigger} from '@angular/material';
import {Observable, Subject} from 'rxjs/Rx';

import {DialogActionsComponent, DialogActionsData} from '../dialog/dialog-actions/dialog-actions.component';
import {DialogAlertComponent, DialogAlertData} from '../dialog/dialog-alert/dialog-alert.component';
import {DialogPromptComponent, DialogPromptData} from '../dialog/dialog-prompt/dialog-prompt.component';
import {StationPropertiesComponent, StationPropertiesData} from '../dialog/station-properties/station-properties.component';
import {DataService} from '../util/data.service';
import {UtilService} from '../util/util.service';
import {TracingService} from './tracing.service';
import {FclElements, ObservedType, Size} from '../util/datatypes';

declare const cytoscape: any;
declare const ResizeSensor: any;
declare const html2canvas: any;

enum MenuActionType {
  runAction, openLayoutMenu
}

interface MenuAction {
  name: string;
  type: MenuActionType;
  enabled: boolean;
  action?: () => void;
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

  actionTypes = MenuActionType;
  graphMenuActions = this.createGraphActions();
  stationMenuActions = this.createStationActions(null);
  deliveryMenuActions = this.createDeliveryActions(null);
  layoutMenuActions = this.createLayoutActions();

  private cy: any;
  private data: FclElements;
  private changeFunction: () => void;

  private mergeDeliveries = DataService.DEFAULT_GRAPH_SETTINGS.mergeDeliveries;
  private nodeSize = DataService.DEFAULT_GRAPH_SETTINGS.nodeSize;
  private fontSize = DataService.DEFAULT_GRAPH_SETTINGS.fontSize;
  private showLegend = DataService.DEFAULT_GRAPH_SETTINGS.showLegend;

  private selectTimerActivated = true;
  private resizeTimer: any;
  private selectTimer: any;
  private zoom: Subject<boolean> = new Subject();
  private legend: Subject<string[]> = new Subject();

  private static createNodeBackground(colors: number[][]): any {
    if (colors.length === 1) {
      return {
        'background-color': UtilService.colorToCss(colors[0])
      };
    }

    const style = {};

    for (let i = 0; i < colors.length; i++) {
      style['pie-' + (i + 1) + '-background-color'] = UtilService.colorToCss(colors[i]);
      style['pie-' + (i + 1) + '-background-size'] = 100 / colors.length;
    }

    return style;
  }

  constructor(private tracingService: TracingService, private dialogService: MdDialog) {
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
    this.cy.on('select', event => this.setSelected(event.cyTarget, true));
    this.cy.on('unselect', event => this.setSelected(event.cyTarget, false));
    this.cy.on('cxttap', event => {
      const element = event.cyTarget;

      if (!element.hasOwnProperty('length')) {
        UtilService.setElementPosition(document.getElementById('graphMenu'), event.originalEvent.offsetX, event.originalEvent.offsetY);
        this.graphMenuTrigger.openMenu();
      } else if (element.group() === 'nodes') {
        this.stationMenuActions = this.createStationActions(element);
        UtilService.setElementPosition(document.getElementById('stationMenu'), event.originalEvent.offsetX, event.originalEvent.offsetY);
        this.stationMenuTrigger.openMenu();
      } else if (element.group() === 'edges') {
        this.deliveryMenuActions = this.createDeliveryActions(element);
        UtilService.setElementPosition(document.getElementById('deliveryMenu'), event.originalEvent.offsetX, event.originalEvent.offsetY);
        this.deliveryMenuTrigger.openMenu();
      }
    });

    this.setFontSize(this.fontSize);
    this.setShowLegend(this.showLegend);
  }

  onChange(changeFunction: () => void) {
    this.changeFunction = changeFunction;
  }

  getLayout(): any {
    const positions = {};

    this.cy.nodes().forEach(n => positions[n.id()] = n.position());

    return {
      name: 'preset',
      positions: positions,
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
      this.legend.next(showLegend ? DataService.PROPERTIES_WITH_COLORS : []);
    }
  }

  updateSelection() {
    if (this.cy != null) {
      this.selectTimerActivated = false;
      this.cy.batch(() => {
        this.cy.elements(':selected[!selected][^contains]').unselect();
        this.cy.elements(':unselected[?selected]').select();
      });
      this.updateEdges();
      this.selectTimerActivated = true;
    }
  }

  private createNodes(): any[] {
    const stations = [];

    for (const s of this.data.stations) {
      if (!s.data.contained && !s.data.invisible) {
        stations.push({
          data: s.data,
          selected: s.data.selected
        });
      }
    }

    return stations;
  }

  private createEdges(): any[] {
    const deliveries = [];

    if (this.mergeDeliveries) {
      const sourceTargetMap = {};

      for (const d of this.data.deliveries) {
        if (!d.data.invisible) {
          const key = d.data.source + '->' + d.data.target;
          const value = sourceTargetMap[key];

          sourceTargetMap[key] = value == null ? [d] : value.concat(d);
        }
      }

      for (const key of Object.keys(sourceTargetMap)) {
        const value = sourceTargetMap[key];
        let delivery;

        if (value.length === 1) {
          delivery = {
            data: value[0].data,
            selected: value[0].data.selected,
          };

          delivery.data.merged = false;
        } else {
          const source = value[0].data.source;
          const target = value[0].data.target;
          const observedElement = value.find(d => d.data.observed !== ObservedType.NONE);

          delivery = {
            data: {
              id: source + '->' + target,
              source: source,
              target: target,
              isEdge: true,
              backward: value.find(d => d.data.backward) != null,
              forward: value.find(d => d.data.forward) != null,
              observed: observedElement != null ? observedElement.data.observed : ObservedType.NONE,
              merged: value.length > 1,
              contains: value.map(d => d.data.id),
            },
            selected: value.find(d => d.data.selected) != null
          };
        }

        deliveries.push(delivery);
      }
    } else {
      for (const d of this.data.deliveries) {
        if (!d.data.invisible) {
          const delivery = {
            data: d.data,
            selected: d.data.selected,
          };

          delivery.data.merged = false;
          deliveries.push(delivery);
        }
      }
    }

    return deliveries;
  }

  private updateEdges() {
    const edges = this.createEdges();

    for (const e of edges) {
      e.group = 'edges';
    }

    this.cy.batch(() => {
      this.cy.edges().remove();
      this.cy.add(edges);
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
      if (s.data.invisible) {
        const pos = this.cy.nodes().getElementById(s.data.id).position();

        if (pos != null) {
          s.data._position = pos;
        }
      }
    }

    const nodes = this.createNodes();
    const edges = this.createEdges();

    for (const e of edges) {
      e.group = 'edges';
    }

    for (const n of nodes) {
      n.group = 'nodes';

      const pos = this.cy.nodes().getElementById(n.data.id).position();

      if (pos == null) {
        if (n.data.hasOwnProperty('_position')) {
          n.position = n.data._position;
          delete n.data._position;
        } else if (n.data.hasOwnProperty('contains')) {
          n.position = UtilService.getCenter(n.data.contains.map(id => this.cy.nodes().getElementById(id).position()));

          for (const contained of this.tracingService.getElementsById(n.data.contains)) {
            const containedPos = this.cy.nodes().getElementById(contained.data.id).position();

            contained.data._relativeTo = n.data.id;
            contained.data._relativePosition = UtilService.difference(containedPos, n.position);
          }
        } else if (n.data.hasOwnProperty('_relativeTo') && n.data.hasOwnProperty('_relativePosition')) {
          n.position = UtilService.sum(this.cy.nodes().getElementById(n.data._relativeTo).position(), n.data._relativePosition);
          delete n.data._relativeTo;
          delete n.data._relativePosition;
        }
      } else {
        n.position = pos;
      }
    }

    this.cy.batch(() => {
      this.cy.elements().remove();
      this.cy.add(nodes);
      this.cy.add(edges);
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
        'background-color': '#FFFFFF',
        'border-width': 3,
        'border-color': '#000000',
        'text-valign': 'bottom',
        'text-halign': 'right',
        'color': '#000000'
      })
      .selector('edge')
      .style({
        'target-arrow-shape': 'triangle',
        'width': 6,
        'line-color': '#000000',
        'target-arrow-color': '#FF0000',
        'curve-style': 'bezier'
      })
      .selector('node:selected')
      .style({
        'background-color': '#8080FF',
        'border-width': 6,
        'border-color': '#0000FF',
        'color': '#0000FF'
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

    for (const combination of UtilService.getAllCombinations(DataService.PROPERTIES_WITH_COLORS)) {
      const s = [];
      const c1 = [];
      const c2 = [];

      for (const prop of combination) {
        const color = DataService.PROPERTIES.get(prop).color;

        s.push(createSelector(prop));
        c1.push(color);
        c2.push(UtilService.mixColors(color, [0, 0, 255]));
      }

      style = style.selector('node' + s.join('')).style(GraphComponent.createNodeBackground(c1));
      style = style.selector('node:selected' + s.join('')).style(GraphComponent.createNodeBackground(c2));
    }

    for (const prop of DataService.PROPERTIES_WITH_COLORS) {
      style = style.selector('edge' + createSelector(prop)).style({
        'line-color': UtilService.colorToCss(DataService.PROPERTIES.get(prop).color)
      });
    }

    return style;
  }

  private setSelected(element: any, selected: boolean) {
    if (element.data('isEdge') && element.data('contains') != null) {
      for (const id of element.data('contains')) {
        this.tracingService.setSelected(id, selected);
      }
    } else {
      this.tracingService.setSelected(element.id(), selected);
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
        type: MenuActionType.openLayoutMenu,
        enabled: true
      }, {
        name: 'Clear Trace',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService.clearTrace();
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Clear Outbreak Stations',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService.clearOutbreakStations();
          this.setNodeSize(this.nodeSize);
          this.callChangeFunction();
        }
      }, {
        name: 'Clear Invisibility',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService.clearInvisibility();
          this.updateAll();
          this.callChangeFunction();
        }
      }
    ];
  }

  private createStationActions(station): MenuAction[] {
    let selectedStations = null;
    let multipleStationsSelected = false;
    let allOutbreakStations = false;
    let allMetaStations = false;
    let allNonMetaStations = false;

    if (this.cy != null && station != null) {
      selectedStations = this.cy.nodes(':selected');
      multipleStationsSelected = station.selected() && selectedStations.size() > 1;
      allOutbreakStations = multipleStationsSelected ? selectedStations.allAre('[?outbreak]') : station.data('outbreak');
      allMetaStations = multipleStationsSelected ? selectedStations.allAre('[?contains]') : station.data('contains');
      allNonMetaStations = multipleStationsSelected ? !selectedStations.is('[?contains]') : !station.data('contains');
    }

    return [
      {
        name: 'Show Properties',
        type: MenuActionType.runAction,
        enabled: !multipleStationsSelected,
        action: () => {
          const dialogData: StationPropertiesData = {
            station: this.tracingService.getElementsById([station.id()])[0]
          };

          this.dialogService.open(StationPropertiesComponent, {data: dialogData});
        }
      }, {
        name: 'Show Forward Trace',
        type: MenuActionType.runAction,
        enabled: !multipleStationsSelected,
        action: () => {
          this.tracingService.showStationForwardTrace(station.id());
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Show Backward Trace',
        type: MenuActionType.runAction,
        enabled: !multipleStationsSelected,
        action: () => {
          this.tracingService.showStationBackwardTrace(station.id());
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Show Whole Trace',
        type: MenuActionType.runAction,
        enabled: !multipleStationsSelected,
        action: () => {
          this.tracingService.showStationTrace(station.id());
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: allOutbreakStations ? 'Unmark as Outbreak' : 'Mark as Outbreak',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          this.tracingService
            .markStationsAsOutbreak(multipleStationsSelected ? selectedStations.map(s => s.id()) : [station.id()], !allOutbreakStations);
          this.setNodeSize(this.nodeSize);
          this.callChangeFunction();
        }
      }, {
        name: 'Make Invisible',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          if (multipleStationsSelected) {
            this.tracingService.makeStationsInvisible(selectedStations.map(s => s.id()));
          } else {
            this.tracingService.makeStationsInvisible([station.id()]);
          }
          this.updateAll();
          this.callChangeFunction();
        }
      }, {
        name: 'Merge Stations',
        type: MenuActionType.runAction,
        enabled: multipleStationsSelected && allNonMetaStations,
        action: () => {
          const dialogData: DialogPromptData = {
            title: 'Input',
            message: 'Please specify name of meta station:',
            placeholder: 'Name'
          };

          this.dialogService.open(DialogPromptComponent, {data: dialogData}).afterClosed().subscribe(name => {
            if (name != null) {
              this.tracingService.mergeStations(selectedStations.map(s => s.id()), name);
              this.updateAll();
              this.callChangeFunction();
            }
          });
        }
      }, {
        name: 'Expand',
        type: MenuActionType.runAction,
        enabled: allMetaStations,
        action: () => {
          this.tracingService.expandStations(multipleStationsSelected ? selectedStations.map(s => s.id()) : station.id());
          this.updateAll();
          this.callChangeFunction();
        }
      }
    ];
  }

  private createDeliveryActions(delivery): MenuAction[] {
    return [
      {
        name: 'Show Forward Trace',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          if (this.isDeliveryTracePossible(delivery)) {
            this.tracingService.showDeliveryForwardTrace(delivery.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }, {
        name: 'Show Backward Trace',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          if (this.isDeliveryTracePossible(delivery)) {
            this.tracingService.showDeliveryBackwardTrace(delivery.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }, {
        name: 'Show Whole Trace',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => {
          if (this.isDeliveryTracePossible(delivery)) {
            this.tracingService.showDeliveryTrace(delivery.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }
      }
    ];
  }

  private createLayoutActions(): MenuAction[] {
    return [
      {
        name: 'Fruchterman-Reingold',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'fruchterman'})
      }, {
        name: 'Constraint-Based',
        type: MenuActionType.runAction,
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

          layout = this.cy.elements().makeLayout({
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
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'random'})
      }, {
        name: 'Grid',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'grid'})
      }, {
        name: 'Circle',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'circle'})
      }, {
        name: 'Concentric',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'concentric'})
      }, {
        name: 'Breadth-first',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'breadthfirst'})
      }, {
        name: 'Spread',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'spread'})
      }, {
        name: 'Directed acyclic graph',
        type: MenuActionType.runAction,
        enabled: true,
        action: () => this.cy.layout({name: 'dagre'})
      }
    ];
  }

  private isDeliveryTracePossible(delivery): boolean {
    if (delivery.data('merged')) {
      const dialogData: DialogAlertData = {
        title: 'Error',
        message: 'Showing Trace of merged delivery is not supported!'
      };

      this.dialogService.open(DialogAlertComponent, {role: 'alertdialog', data: dialogData});
      return false;
    } else {
      return true;
    }
  }

  private callChangeFunction() {
    if (this.changeFunction != null) {
      this.changeFunction();
    }
  }

}
