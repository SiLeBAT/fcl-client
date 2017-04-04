import {Component, OnInit, ViewChild} from '@angular/core';
import {MdDialog, MdMenuTrigger} from '@angular/material';
import {Observable, Subject} from 'rxjs/Rx';

import {DialogActionsComponent, DialogActionsData} from '../dialog/dialog-actions/dialog-actions.component';
import {DialogAlertComponent, DialogAlertData} from '../dialog/dialog-alert/dialog-alert.component';
import {DialogPromptComponent, DialogPromptData} from '../dialog/dialog-prompt/dialog-prompt.component';
import {DataService} from '../util/data.service';
import {UtilService} from '../util/util.service';
import {TracingService} from './tracing.service';

declare const cytoscape: any;
declare const ResizeSensor: any;

enum MenuActionType {
  runAction, openLayoutMenu
}

interface MenuAction {
  name: string;
  type: MenuActionType;
  action?: () => void;
}

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {

  @ViewChild(MdMenuTrigger) trigger: MdMenuTrigger;

  actionTypes = MenuActionType;
  menuActions: MenuAction[];
  layoutMenuActions: MenuAction[];

  private cy: any;
  private data: any;
  private changeFunction: () => void;

  private mergeDeliveries = DataService.DEFAULT_GRAPH_SETTINGS.mergeDeliveries;
  private nodeSize = DataService.DEFAULT_GRAPH_SETTINGS.nodeSize;
  private fontSize = DataService.DEFAULT_GRAPH_SETTINGS.fontSize;
  private showLegend = DataService.DEFAULT_GRAPH_SETTINGS.showLegend;

  private selectTimerActivated = true;
  private resizeTimer: any;
  private selectTimer: any;
  private legend: Subject<Set<string>>;

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

  init(data: any) {
    this.data = data.elements;
    this.cy = cytoscape({
      container: document.getElementById('cy'),

      elements: {
        nodes: this.createNodes(),
        edges: this.createEdges()
      },

      layout: data.layout,
      style: this.createStyle(),
      minZoom: 0.01,
      maxZoom: 10,
      wheelSensitivity: 0.5,
    });

    this.layoutMenuActions = this.createLayoutActions();
    this.cy.zooming();
    this.legend = new Subject();
    this.cy.legend(this.legend);
    this.cy.on('zoom', () => this.setFontSize(this.fontSize));
    this.cy.on('select', event => this.setSelected(event.cyTarget, true));
    this.cy.on('unselect', event => this.setSelected(event.cyTarget, false));
    this.cy.on('cxttap', event => {
      const element = event.cyTarget;

      if (!element.hasOwnProperty('length')) {
        this.menuActions = this.createGraphActions();
      } else if (element.group() === 'nodes') {
        this.menuActions = this.createStationActions(element);
      } else if (element.group() === 'edges') {
        this.menuActions = this.createDeliveryActions(element);
      }

      const menu = document.getElementById('cy-menu');

      menu.style.left = event.originalEvent.offsetX + 'px';
      menu.style.top = event.originalEvent.offsetY + 'px';
      this.trigger.openMenu();
    });

    this.setFontSize(this.fontSize);
    this.setShowLegend(this.showLegend);
    this.tracingService.init(this.data);
  }

  onChange(changeFunction: () => void) {
    this.changeFunction = changeFunction;
  }

  getJson(): any {
    const positions = {};

    this.cy.nodes().forEach(n => positions[n.id()] = n.position());

    return {
      elements: this.data,
      layout: {
        name: 'preset',
        positions: positions,
        zoom: this.cy.zoom(),
        pan: this.cy.pan()
      }
    };
  }

  setMergeDeliveries(mergeDeliveries: boolean) {
    this.mergeDeliveries = mergeDeliveries;

    if (this.cy != null) {
      this.updateEdges();
    }
  }

  setNodeSize(nodeSize: number) {
    this.nodeSize = nodeSize;

    if (this.cy != null) {
      this.recalculateNodeSizes();
      this.updateProperties();
    }
  }

  setFontSize(fontSize: number) {
    this.fontSize = fontSize;

    if (this.cy != null) {
      this.cy.nodes().style({
        'font-size': Math.max(fontSize / this.cy.zoom(), fontSize)
      });
    }
  }

  setShowLegend(showLegend: boolean) {
    this.showLegend = showLegend;

    if (this.cy != null) {
      this.legend.next(showLegend ? new Set(DataService.PROPERTIES.keys()) : new Set());
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

          delivery = {
            data: {
              id: source + '->' + target,
              source: source,
              target: target,
              isEdge: true,
              backward: value.find(d => d.data.backward) != null,
              forward: value.find(d => d.data.forward) != null,
              observed: value.find(d => d.data.observed) != null,
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
      this.cy.nodes().data('_update', true);
    } else {
      this.cy.elements().data('_update', true);
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

    this.recalculateNodeSizes();

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

  private recalculateNodeSizes() {
    let maxScore = 0;

    for (const s of this.data.stations) {
      maxScore = Math.max(maxScore, s.data.score);
    }

    if (maxScore > 0) {
      for (const s of this.data.stations) {
        s.data._size = (0.5 + 0.5 * s.data.score / maxScore) * this.nodeSize;
      }
    } else {
      for (const s of this.data.stations) {
        s.data._size = this.nodeSize;
      }
    }
  }

  private createStyle(): any {
    const sizeFunction = node => node.data('_size') == null ? this.nodeSize : node.data('_size');

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

    const nodeProps = ['forward', 'backward', 'observed', 'outbreak', 'commonLink'];
    const edgeProps = ['forward', 'backward', 'observed'];

    for (const combination of UtilService.getAllCombinations(nodeProps)) {
      const s = [];
      const c1 = [];
      const c2 = [];

      for (const prop of combination) {
        const color = DataService.PROPERTIES.get(prop).color;

        s.push('[?' + prop + ']');
        c1.push(color);
        c2.push(UtilService.mixColors(color, [0, 0, 255]));
      }

      style = style.selector('node' + s.join('')).style(GraphComponent.createNodeBackground(c1));
      style = style.selector('node:selected' + s.join('')).style(GraphComponent.createNodeBackground(c2));
    }

    for (const prop of edgeProps) {
      style = style.selector('edge[?' + prop + ']').style({
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
        type: MenuActionType.openLayoutMenu
      }, {
        name: 'Clear Trace',
        type: MenuActionType.runAction,
        action: () => {
          this.tracingService.clearTrace();
          this.updateProperties();
          this.callChangeFunction();
        }
      }, {
        name: 'Clear Outbreak Stations',
        type: MenuActionType.runAction,
        action: () => {
          this.tracingService.clearOutbreakStations();
          this.setNodeSize(this.nodeSize);
          this.callChangeFunction();
        }
      }, {
        name: 'Clear Invisibility',
        type: MenuActionType.runAction,
        action: () => {
          this.tracingService.clearInvisibility();
          this.updateAll();
          this.callChangeFunction();
        }
      }
    ];
  }

  private createStationActions(station): MenuAction[] {
    const selectedStations = this.cy.nodes(':selected');
    let actions: MenuAction[];

    if (station.selected() && selectedStations.size() > 1) {
      actions = [
        {
          name: 'Merge Stations',
          type: MenuActionType.runAction,
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
          name: 'Mark as Outbreak',
          type: MenuActionType.runAction,
          action: () => {
            this.tracingService.markStationsAsOutbreak(selectedStations.map(s => s.id()));
            this.setNodeSize(this.nodeSize);
            this.callChangeFunction();
          }
        }, {
          name: 'Make Invisible',
          type: MenuActionType.runAction,
          action: () => {
            this.tracingService.makeStationsInvisible(selectedStations.map(s => s.id()));
            this.updateAll();
            this.callChangeFunction();
          }
        }
      ];
    } else {
      actions = [
        {
          name: 'Show Forward Trace',
          type: MenuActionType.runAction,
          action: () => {
            this.tracingService.showStationForwardTrace(station.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }, {
          name: 'Show Backward Trace',
          type: MenuActionType.runAction,
          action: () => {
            this.tracingService.showStationBackwardTrace(station.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }, {
          name: 'Show Whole Trace',
          type: MenuActionType.runAction,
          action: () => {
            this.tracingService.showStationTrace(station.id());
            this.updateProperties();
            this.callChangeFunction();
          }
        }, {
          name: station.data('outbreak') ? 'Unmark as Outbreak' : 'Mark as Outbreak',
          type: MenuActionType.runAction,
          action: () => {
            this.tracingService.toggleOutbreakStation(station.id());
            this.setNodeSize(this.nodeSize);
            this.callChangeFunction();
          }
        }, {
          name: 'Make Invisible',
          type: MenuActionType.runAction,
          action: () => {
            this.tracingService.makeStationsInvisible([station.id()]);
            this.updateAll();
            this.callChangeFunction();
          }
        }
      ];

      if (station.data('contains')) {
        actions.push({
          name: 'Expand',
          type: MenuActionType.runAction,
          action: () => {
            this.tracingService.expandStation(station.id());
            this.updateAll();
            this.callChangeFunction();
          }
        });
      }
    }

    return actions;
  }

  private createDeliveryActions(delivery): MenuAction[] {
    return [
      {
        name: 'Show Forward Trace',
        type: MenuActionType.runAction,
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
        action: () => this.cy.layout({name: 'fruchterman'})
      }, {
        name: 'Constraint-Based',
        type: MenuActionType.runAction,
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
        action: () => this.cy.layout({name: 'random'})
      }, {
        name: 'Grid',
        type: MenuActionType.runAction,
        action: () => this.cy.layout({name: 'grid'})
      }, {
        name: 'Circle',
        type: MenuActionType.runAction,
        action: () => this.cy.layout({name: 'circle'})
      }, {
        name: 'Concentric',
        type: MenuActionType.runAction,
        action: () => this.cy.layout({name: 'concentric'})
      }, {
        name: 'Breadth-first',
        type: MenuActionType.runAction,
        action: () => this.cy.layout({name: 'breadthfirst'})
      }, {
        name: 'Spread',
        type: MenuActionType.runAction,
        action: () => this.cy.layout({name: 'spread'})
      }, {
        name: 'Directed acyclic graph',
        type: MenuActionType.runAction,
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
