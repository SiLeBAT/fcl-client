import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
import {D3, D3Service, Selection} from 'd3-ng2-service';
import {Subject} from 'rxjs/Rx';

import {Connection, DeliveryData, DialogAlignment, StationData} from '../../util/datatypes';
import {Constants} from '../../util/constants';
import {Utils} from '../../util/utils';

export interface StationPropertiesData {
  station: StationData;
  deliveries: Map<string, DeliveryData>;
  hoverDeliveries: Subject<string[]>;
}

interface NodeDatum {
  id: string;
  title: string;
  x: number;
  y: number;
}

interface EdgeDatum {
  source: NodeDatum;
  target: NodeDatum;
}

class DataOptimizer {

  private inIds: string[];
  private inConnections: Map<string, string[]>;
  private outIds: string[];
  private outConnections: Map<string, string[]>;

  constructor(private nodeInData: NodeDatum[], private nodeOutData: NodeDatum[], private edgeData: EdgeDatum[]) {
    this.inIds = [];
    this.inConnections = new Map();
    this.outIds = [];
    this.outConnections = new Map();

    for (const n of nodeInData) {
      this.inIds.push(n.id);
      this.inConnections.set(n.id, []);
    }

    for (const n of nodeOutData) {
      this.outIds.push(n.id);
      this.outConnections.set(n.id, []);
    }

    for (const e of edgeData) {
      this.inConnections.get(e.source.id).push(e.target.id);
      this.outConnections.get(e.target.id).push(e.source.id);
    }
  }

  optimize() {
    for (let i = 0; i < 1; i++) {
      this.step(this.inIds, this.inConnections, this.outIds);
      this.step(this.outIds, this.outConnections, this.inIds);
    }

    const nodesInById: Map<string, NodeDatum> = new Map();
    const nodesOutById: Map<string, NodeDatum> = new Map();

    for (const n of this.nodeInData) {
      nodesInById.set(n.id, n);
    }

    for (const n of this.nodeOutData) {
      nodesOutById.set(n.id, n);
    }

    this.inIds.forEach((id, index) => {
      this.nodeInData[index] = nodesInById.get(id);
    });

    this.outIds.forEach((id, index) => {
      this.nodeOutData[index] = nodesOutById.get(id);
    });
  }

  private step(ids1: string[], connections1: Map<string, string[]>, ids2: string[]) {
    const indices2: Map<string, number> = new Map();

    ids2.forEach((id, index) => indices2.set(id, index));

    const centers1: Map<string, number> = new Map();

    for (const id of ids1) {
      const connections = connections1.get(id);
      let sum = 0;

      for (const c of connections) {
        sum += indices2.get(c);
      }

      centers1.set(id, connections.length > 0 ? sum / connections.length : Infinity);
    }

    const sortedCenters1 = Array.from(centers1.entries());

    sortedCenters1.sort((a, b) => a[1] - b[1]);
    sortedCenters1.forEach((center, index) => {
      ids1[index] = center[0];
    });
  }
}

@Component({
  selector: 'app-station-properties',
  templateUrl: './station-properties.component.html',
  styleUrls: ['./station-properties.component.css']
})
export class StationPropertiesComponent implements OnInit, OnDestroy {

  private static readonly NODE = 'node';
  private static readonly HOVER = 'hover';
  private static readonly EDGE = 'edge';
  private static readonly HIDDEN = 'hidden';

  private static readonly SVG_WIDTH = 600;
  private static readonly NODE_PADDING = 15;
  private static readonly NODE_WIDTH = 200;
  private static readonly NODE_HEIGHT = 30;

  title: string;
  propertiesHidden = false;
  properties: { name: string, value: string }[];

  private dialogAlign = DialogAlignment.CENTER;
  private d3: D3;

  private nodeInData: NodeDatum[];
  private nodeOutData: NodeDatum[];
  private edgeData: EdgeDatum[];
  private lotBased: boolean;
  private deliveriesByLot: Map<string, string[]>;
  private height: number;
  private selected: NodeDatum;

  private svg: Selection<SVGGElement, any, any, any>;
  private nodesInG: Selection<SVGElement, any, any, any>;
  private nodesOutG: Selection<SVGElement, any, any, any>;
  private edgesG: Selection<SVGElement, any, any, any>;
  private connectLine: Selection<SVGElement, any, any, any>;

  private static line(x1: number, y1: number, x2: number, y2: number) {
    return 'M' + x1 + ',' + y1 + 'L' + x2 + ',' + y2;
  }

  constructor(public dialogRef: MdDialogRef<StationPropertiesComponent>, @Inject(MD_DIALOG_DATA) public data: StationPropertiesData,
              d3Service: D3Service) {
    this.title = data.station.name;
    this.properties = Object.keys(data.station)
      .filter(key => Constants.PROPERTIES.has(key) && key !== 'name' && key !== 'incoming' && key !== 'outgoing')
      .map(key => {
        const value = data.station[key];

        return {
          name: Constants.PROPERTIES.get(key).name,
          value: value != null ? String(value) : ''
        };
      }).concat(data.station.properties.map(prop => {
        return {
          name: prop.name,
          value: prop.value != null ? prop.value : ''
        };
      }));
    this.d3 = d3Service.getD3();

    if (data.station.incoming.length > 0 || data.station.outgoing.length > 0) {
      const ingredientsByLot = this.getIngredientsByLot();

      this.lotBased = ingredientsByLot != null;

      if (this.lotBased) {
        this.initLotBasedData(ingredientsByLot);
        this.deliveriesByLot = new Map();

        this.data.deliveries.forEach(d => {
          if (this.deliveriesByLot.has(d.lot)) {
            this.deliveriesByLot.get(d.lot).push(d.id);
          } else {
            this.deliveriesByLot.set(d.lot, [d.id]);
          }
        });
      } else {
        this.initDeliveryBasedData();
      }

      const optimizer = new DataOptimizer(this.nodeInData, this.nodeOutData, this.edgeData);

      optimizer.optimize();

      let yIn = StationPropertiesComponent.NODE_PADDING + StationPropertiesComponent.NODE_HEIGHT / 2;
      let yOut = StationPropertiesComponent.NODE_PADDING + StationPropertiesComponent.NODE_HEIGHT / 2;

      for (const n of this.nodeInData) {
        n.x = StationPropertiesComponent.NODE_WIDTH / 2 + 1;
        n.y = yIn;
        yIn += StationPropertiesComponent.NODE_HEIGHT + StationPropertiesComponent.NODE_PADDING;
      }

      for (const n of this.nodeOutData) {
        n.x = StationPropertiesComponent.SVG_WIDTH - StationPropertiesComponent.NODE_WIDTH / 2 - 1;
        n.y = yOut;
        yOut += StationPropertiesComponent.NODE_HEIGHT + StationPropertiesComponent.NODE_PADDING;
      }

      this.height = Math.max(yIn, yOut) - StationPropertiesComponent.NODE_HEIGHT / 2;
    }
  }

  //noinspection JSUnusedGlobalSymbols
  close() {
    let connections: Connection[];

    if (this.lotBased) {
      connections = [];

      for (const e of this.edgeData) {
        for (const d of this.deliveriesByLot.get(e.target.id)) {
          connections.push({
            source: e.source.id,
            target: d
          });
        }
      }
    } else {
      connections = this.edgeData.map(edge => {
        return {
          source: edge.source.id,
          target: edge.target.id
        };
      });
    }

    this.dialogRef.close(connections);
  }

  ngOnInit() {
    if (this.height != null) {
      this.svg = this.d3
        .select('#in-out-connector').append<SVGGElement>('svg')
        .attr('width', StationPropertiesComponent.SVG_WIDTH).attr('height', this.height)
        .on('click', () => {
          this.selected = null;
          this.connectLine.classed(StationPropertiesComponent.HIDDEN, true);
        });

      const defs = this.svg.append<SVGElement>('defs');
      const g = this.svg.append<SVGElement>('g');

      defs.append('marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 7)
        .attr('markerWidth', 3.5)
        .attr('markerHeight', 3.5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5');

      this.connectLine = g.append<SVGElement>('path').classed(StationPropertiesComponent.EDGE, true)
        .classed(StationPropertiesComponent.HIDDEN, true).attr('marker-end', 'url(#end-arrow)');
      this.edgesG = g.append<SVGElement>('g');
      this.nodesInG = g.append<SVGElement>('g');
      this.nodesOutG = g.append<SVGElement>('g');

      this.addNodes();
      this.updateEdges();

      this.d3.select('body').on('mousemove', () => this.updateConnectLine());
    }

    this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
  }

  ngOnDestroy() {
    this.d3.select('body').on('mousemove', null);
  }

  moveLeft() {
    this.dialogAlign = this.dialogAlign === DialogAlignment.RIGHT ? DialogAlignment.CENTER : DialogAlignment.LEFT;
    this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
  }

  moveRight() {
    this.dialogAlign = this.dialogAlign === DialogAlignment.LEFT ? DialogAlignment.CENTER : DialogAlignment.RIGHT;
    this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
  }

  toggleProperties() {
    this.propertiesHidden = !this.propertiesHidden;
  }

  private getDeliveryLabel(id: string): string {
    const delivery = this.data.deliveries.get(id);
    let label = delivery.name;

    if (delivery.date != null) {
      label += ' ' + delivery.date;
    }

    return label;
  }

  private getIngredientsByLot(): Map<string, Set<string>> {
    const ingredientsByDelivery: Map<string, Set<string>> = new Map();

    for (const id of this.data.station.outgoing) {
      ingredientsByDelivery.set(id, new Set());
    }

    for (const c of this.data.station.connections) {
      ingredientsByDelivery.get(c.target).add(c.source);
    }

    const ingredientsByLot: Map<string, Set<string>> = new Map();
    let valid = true;

    ingredientsByDelivery.forEach((value, key) => {
      const lot = this.data.deliveries.get(key).lot;

      if (lot == null) {
        valid = false;
      } else {
        if (!ingredientsByLot.has(lot)) {
          ingredientsByLot.set(lot, value);
        } else {
          const oldValue = ingredientsByLot.get(lot);
          const areEqual = value.size === oldValue.size && Array.from(value).find(v => !oldValue.has(v)) == null;

          if (!areEqual) {
            valid = false;
          }
        }
      }
    });

    return valid ? ingredientsByLot : null;
  }

  private initDeliveryBasedData() {
    const nodeInMap: Map<string, NodeDatum> = new Map();
    const nodeOutMap: Map<string, NodeDatum> = new Map();

    for (const id of this.data.station.incoming) {
      nodeInMap.set(id, {
        id: id,
        title: this.getDeliveryLabel(id),
        x: null,
        y: null
      });
    }

    for (const id of this.data.station.outgoing) {
      nodeOutMap.set(id, {
        id: id,
        title: this.getDeliveryLabel(id),
        x: null,
        y: null
      });
    }

    this.nodeInData = Array.from(nodeInMap.values());
    this.nodeOutData = Array.from(nodeOutMap.values());
    this.edgeData = [];

    for (const c of this.data.station.connections) {
      this.edgeData.push({
        source: nodeInMap.get(c.source),
        target: nodeOutMap.get(c.target)
      });
    }
  }

  private initLotBasedData(ingredientsByLot: Map<string, Set<string>>) {
    const nodeInMap: Map<string, NodeDatum> = new Map();
    const nodeOutMap: Map<string, NodeDatum> = new Map();

    for (const id of this.data.station.incoming) {
      nodeInMap.set(id, {
        id: id,
        title: this.getDeliveryLabel(id),
        x: null,
        y: null
      });
    }

    this.nodeInData = Array.from(nodeInMap.values());
    this.edgeData = [];

    ingredientsByLot.forEach((ingredients, lot) => {
      nodeOutMap.set(lot, {
        id: lot,
        title: lot,
        x: null,
        y: null
      });
      ingredients.forEach(d => {
        this.edgeData.push({
          source: nodeInMap.get(d),
          target: nodeOutMap.get(lot)
        });
      });
    });

    this.nodeOutData = Array.from(nodeOutMap.values());
  }

  private addNodes() {
    const initRectAndText = (nodes: Selection<SVGElement, NodeDatum, any, any>) => {
      nodes.classed(StationPropertiesComponent.NODE, true).attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
      nodes.append('rect').attr('x', -StationPropertiesComponent.NODE_WIDTH / 2).attr('y', -StationPropertiesComponent.NODE_HEIGHT / 2)
        .attr('width', StationPropertiesComponent.NODE_WIDTH).attr('height', StationPropertiesComponent.NODE_HEIGHT);
      nodes.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').text(d => d.title);
    };

    const nodesIn = this.nodesInG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeInData, d => d.id).enter().append<SVGElement>('g');
    const nodesOut = this.nodesOutG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeOutData, d => d.id).enter().append<SVGElement>('g');

    initRectAndText(nodesIn);
    initRectAndText(nodesOut);

    const self = this;

    nodesIn.on('mouseover', function (d) {
      self.d3.select(this).classed(StationPropertiesComponent.HOVER, true);
      self.data.hoverDeliveries.next([d.id]);
    }).on('mouseout', function () {
      self.d3.select(this).classed(StationPropertiesComponent.HOVER, false);
      self.data.hoverDeliveries.next([]);
    }).on('click', function (d) {
      if (self.selected == null) {
        self.selected = d;
        self.updateConnectLine();
        self.connectLine.classed(StationPropertiesComponent.HIDDEN, false);
        self.d3.select(this).classed(StationPropertiesComponent.HOVER, false);
        self.d3.event.stopPropagation();
      }
    });

    nodesOut.on('mouseover', function (d) {
      self.d3.select(this).classed(StationPropertiesComponent.HOVER, true);
      self.data.hoverDeliveries.next(self.lotBased ? self.deliveriesByLot.get(d.id) : [d.id]);
    }).on('mouseout', function () {
      self.d3.select(this).classed(StationPropertiesComponent.HOVER, false);
      self.data.hoverDeliveries.next([]);
    }).on('click', function (d) {
      if (self.selected != null) {
        self.d3.select(this).classed(StationPropertiesComponent.HOVER, false);

        if (self.edgeData.find(e => e.source === self.selected && e.target === d) == null) {
          self.edgeData.push({
            source: self.selected,
            target: d
          });
          self.updateEdges();
        }
      }
    });
  }

  private updateEdges() {
    const edges = this.edgesG.selectAll<SVGElement, EdgeDatum>('path')
      .data(this.edgeData, d => d.source.id + Constants.ARROW_STRING + d.target.id);

    const self = this;

    edges.enter().append('path').classed(StationPropertiesComponent.EDGE, true).attr('d', d => {
      return StationPropertiesComponent.line(
        d.source.x + StationPropertiesComponent.NODE_WIDTH / 2,
        d.source.y,
        d.target.x - StationPropertiesComponent.NODE_WIDTH / 2,
        d.target.y
      );
    }).on('mouseover', function () {
      if (self.selected == null) {
        self.d3.select(this).classed(StationPropertiesComponent.HOVER, true);
      }
    }).on('mouseout', function () {
      self.d3.select(this).classed(StationPropertiesComponent.HOVER, false);
    }).on('click', function (d) {
      if (self.selected == null) {
        self.edgeData.splice(self.edgeData.indexOf(d), 1);
        self.updateEdges();
      }
    });

    edges.exit().remove();
  }

  private updateConnectLine() {
    if (this.selected != null) {
      const mouseEvent: MouseEvent = this.d3.event;
      const svgPos = this.svg.node().getBoundingClientRect();

      this.connectLine.attr('d', StationPropertiesComponent.line(
        this.selected.x + StationPropertiesComponent.NODE_WIDTH / 2,
        this.selected.y,
        mouseEvent.clientX - svgPos.left,
        mouseEvent.clientY - svgPos.top
      ));
    }
  }
}
