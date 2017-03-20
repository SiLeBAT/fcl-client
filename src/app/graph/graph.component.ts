import {Component, OnInit, ViewChild} from '@angular/core';
import {MdDialog, MdMenuTrigger} from '@angular/material';
import {Observable} from 'rxjs/Rx';

import {DialogActionsComponent} from '../dialog/dialog-actions/dialog-actions.component';
import {DialogActionsData} from '../dialog/dialog-actions/dialog-actions.data';
import {DialogAlertComponent} from '../dialog/dialog-alert/dialog-alert.component';
import {DialogAlertData} from '../dialog/dialog-alert/dialog-alert.data';
import {DialogPromptComponent} from '../dialog/dialog-prompt/dialog-prompt.component';
import {DialogPromptData} from '../dialog/dialog-prompt/dialog-prompt.data';
import {DataService} from '../util/data.service';
import {UtilService} from '../util/util.service';
import {TracingService} from './tracing.service';

declare const cytoscape: any;
declare const ResizeSensor: any;

interface MenuAction {
  text: string;
  action?: () => void;
  openLayoutMenu?: boolean;
}

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrls: ['./graph.component.css']
})
export class GraphComponent implements OnInit {

  @ViewChild(MdMenuTrigger) trigger: MdMenuTrigger;

  //noinspection JSMismatchedCollectionQueryUpdate
  private menuActions: MenuAction[];
  //noinspection JSMismatchedCollectionQueryUpdate
  private layoutMenuActions: MenuAction[];

  private cy: any;
  private data: any;
  private changeFunction: () => void;

  private mergeDeliveries = DataService.DEFAULT_GRAPH_SETTINGS.mergeDeliveries;
  private nodeSize = DataService.DEFAULT_GRAPH_SETTINGS.nodeSize;
  private fontSize = DataService.DEFAULT_GRAPH_SETTINGS.fontSize;

  private resizeTimer: any;
  private selectTimer: any;

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
    this.cy.panzoom();
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
    this.tracingService.init(this.data);
  }

  onColorChange(changeFunction: () => void) {
    this.changeFunction = changeFunction;
  }

  getJson(): any {
    const json = this.cy.json();
    const positions = {};

    for (const n of json.elements.nodes) {
      positions[n.data.id] = n.position;
    }

    return {
      elements: this.data,
      layout: {
        name: 'preset',
        positions: positions,
        zoom: json.zoom,
        pan: json.pan
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
              contains: value.map(d => d.data.id)
            },
            selected: value.find(d => d.data.selected === true) != null
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
      });

    const nodeProps = {
      'forward': DataService.COLORS.forward,
      'backward': DataService.COLORS.backward,
      'observed': DataService.COLORS.observed,
      'outbreak': DataService.COLORS.outbreak,
      'commonLink': DataService.COLORS.commonLink
    };

    const edgeProps = {
      'forward': DataService.COLORS.forward,
      'backward': DataService.COLORS.backward,
      'observed': DataService.COLORS.observed
    };

    for (const combination of UtilService.getAllCombinations(Object.keys(nodeProps))) {
      const s = [];
      const c1 = [];
      const c2 = [];

      for (const prop of combination) {
        s.push('[?' + prop + ']');
        c1.push(nodeProps[prop]);
        c2.push(UtilService.mixColors(nodeProps[prop], [0, 0, 255]));
      }

      style = style.selector('node' + s.join('')).style(GraphComponent.createNodeBackground(c1));
      style = style.selector('node:selected' + s.join('')).style(GraphComponent.createNodeBackground(c2));
    }

    for (const prop of Object.keys(edgeProps)) {
      style = style.selector('edge[?' + prop + ']').style({
        'line-color': UtilService.colorToCss(edgeProps[prop])
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

    if (this.selectTimer != null) {
      this.selectTimer.unsubscribe();
    }

    this.selectTimer = Observable.timer(50).subscribe(() => this.changeFunction());
  }

  private createGraphActions(): MenuAction[] {
    return [
      {
        text: 'Apply Layout',
        openLayoutMenu: true
      }, {
        text: 'Clear Trace',
        action: () => {
          this.tracingService.clearTrace();
          this.updateProperties();
          this.changeFunction();
        }
      }, {
        text: 'Clear Outbreak Stations',
        action: () => {
          this.tracingService.clearOutbreakStations();
          this.setNodeSize(this.nodeSize);
          this.changeFunction();
        }
      }, {
        text: 'Clear Invisibility',
        action: () => {
          this.tracingService.clearInvisibility();
          this.updateAll();
          this.changeFunction();
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
          text: 'Merge Stations',
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
                this.changeFunction();
              }
            });
          }
        }, {
          text: 'Mark as Outbreak',
          action: () => {
            this.tracingService.markStationsAsOutbreak(selectedStations.map(s => s.id()));
            this.setNodeSize(this.nodeSize);
            this.changeFunction();
          }
        }, {
          text: 'Make Invisible',
          action: () => {
            this.tracingService.makeStationsInvisible(selectedStations.map(s => s.id()));
            this.changeFunction();
          }
        }
      ];
    } else {
      actions = [
        {
          text: 'Show Forward Trace',
          action: () => {
            this.tracingService.showStationForwardTrace(station.id());
            this.updateProperties();
            this.changeFunction();
          }
        }, {
          text: 'Show Backward Trace',
          action: () => {
            this.tracingService.showStationBackwardTrace(station.id());
            this.updateProperties();
            this.changeFunction();
          }
        }, {
          text: 'Show Whole Trace',
          action: () => {
            this.tracingService.showStationTrace(station.id());
            this.updateProperties();
            this.changeFunction();
          }
        }, {
          text: station.data('outbreak') ? 'Unmark as Outbreak' : 'Mark as Outbreak',
          action: () => {
            this.tracingService.toggleOutbreakStation(station.id());
            this.setNodeSize(this.nodeSize);
            this.changeFunction();
          }
        }, {
          text: 'Make Invisible',
          action: () => {
            this.tracingService.makeStationsInvisible([station.id()]);
            this.updateAll();
            this.changeFunction();
          }
        }
      ];

      if (station.data('contains')) {
        actions.push({
          text: 'Expand',
          action: () => {
            this.tracingService.expandStation(station.id());
            this.updateAll();
            this.changeFunction();
          }
        });
      }
    }

    return actions;
  }

  private createDeliveryActions(delivery): MenuAction[] {
    return [
      {
        text: 'Show Forward Trace',
        action: () => {
          if (this.isDeliveryTracePossible(delivery)) {
            this.tracingService.showDeliveryForwardTrace(delivery.id());
            this.updateProperties();
            this.changeFunction();
          }
        }
      }, {
        text: 'Show Backward Trace',
        action: () => {
          if (this.isDeliveryTracePossible(delivery)) {
            this.tracingService.showDeliveryBackwardTrace(delivery.id());
            this.updateProperties();
            this.changeFunction();
          }
        }
      }, {
        text: 'Show Whole Trace',
        action: () => {
          if (this.isDeliveryTracePossible(delivery)) {
            this.tracingService.showDeliveryTrace(delivery.id());
            this.updateProperties();
            this.changeFunction();
          }
        }
      }
    ];
  }

  private createLayoutActions(): MenuAction[] {
    return [
      {
        text: 'Fruchterman-Reingold',
        action: () => this.cy.layout({name: 'fruchterman'})
      }, {
        text: 'Constraint-Based',
        action: () => {
          let layout;
          const layoutDialogData: DialogActionsData = {
            title: 'Layout running',
            actions: [['Stop', () => layout.stop()]]
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
        text: 'Random',
        action: () => this.cy.layout({name: 'random'})
      }, {
        text: 'Grid',
        action: () => this.cy.layout({name: 'grid'})
      }, {
        text: 'Circle',
        action: () => this.cy.layout({name: 'circle'})
      }, {
        text: 'Concentric',
        action: () => this.cy.layout({name: 'concentric'})
      }, {
        text: 'Breadth-first',
        action: () => this.cy.layout({name: 'breadthfirst'})
      }, {
        text: 'Spread',
        action: () => this.cy.layout({name: 'spread'})
      }, {
        text: 'Directed acyclic graph',
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

}
