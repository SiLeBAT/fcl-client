import {Component, Inject, OnInit} from '@angular/core';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
import {D3, D3Service, Selection} from 'd3-ng2-service';

import {Connection, DeliveryData, StationData} from '../../util/datatypes';
import {Constants} from '../../util/constants';

export interface StationPropertiesData {
  station: StationData;
  deliveries: Map<string, DeliveryData>;
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

@Component({
  templateUrl: './station-properties.component.html',
  styleUrls: ['./station-properties.component.css']
})
export class StationPropertiesComponent implements OnInit {

  private static readonly NODE = 'node';
  private static readonly HOVER = 'hover';
  private static readonly EDGE = 'edge';
  private static readonly HIDDEN = 'hidden';

  private static readonly SVG_WIDTH = 600;
  private static readonly NODE_PADDING = 15;
  private static readonly NODE_WIDTH = 200;
  private static readonly NODE_HEIGHT = 30;

  properties: { name: string, value: string }[];

  private d3: D3;

  private nodeInData: NodeDatum[];
  private nodeOutData: NodeDatum[];
  private edgeData: EdgeDatum[];
  private lotBased: boolean;
  private height: number;

  private nodesInG: Selection<SVGElement, any, any, any>;
  private nodesOutG: Selection<SVGElement, any, any, any>;
  private edgesG: Selection<SVGElement, any, any, any>;
  private dragLine: Selection<SVGElement, any, any, any>;

  constructor(public dialogRef: MdDialogRef<StationPropertiesComponent>, @Inject(MD_DIALOG_DATA) public data: StationPropertiesData,
              d3Service: D3Service) {
    this.properties = Object.keys(data.station)
      .filter(key => Constants.PROPERTIES.has(key) && key !== 'incoming' && key !== 'outgoing')
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

    if (data.station.incoming.length > 0 && data.station.outgoing.length > 0) {
      const ingredientsByLot = this.getIngredientsByLot();

      this.lotBased = ingredientsByLot != null;

      if (this.lotBased) {
        this.initLotBasedData(ingredientsByLot);
      } else {
        this.initDeliveryBasedData();
      }

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
      const deliveriesByLot: Map<string, string[]> = new Map();

      this.data.deliveries.forEach(d => {
        if (deliveriesByLot.has(d.lot)) {
          deliveriesByLot.get(d.lot).push(d.id);
        } else {
          deliveriesByLot.set(d.lot, [d.id]);
        }
      });

      connections = [];

      for (const e of this.edgeData) {
        for (const d of deliveriesByLot.get(e.target.id)) {
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
      const svg: Selection<SVGElement, any, any, any> = this.d3
        .select('#in-out-connector').append<SVGElement>('svg')
        .attr('width', StationPropertiesComponent.SVG_WIDTH).attr('height', this.height)
        .on('mouseup', () => this.dragLine.classed(StationPropertiesComponent.HIDDEN, true));

      const defs = svg.append<SVGElement>('defs');

      defs.append('marker')
        .attr('id', 'end-arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 7)
        .attr('markerWidth', 3.5)
        .attr('markerHeight', 3.5)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5');

      const g = svg.append<SVGElement>('g');

      this.dragLine = g.append<SVGElement>('path').classed(StationPropertiesComponent.EDGE, true)
        .classed(StationPropertiesComponent.HIDDEN, true).attr('marker-end', 'url(#end-arrow)');
      this.edgesG = g.append<SVGElement>('g');
      this.nodesInG = g.append<SVGElement>('g');
      this.nodesOutG = g.append<SVGElement>('g');

      this.addNodes();
      this.updateEdges();
    }
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

    this.edgeData = [];

    for (const c of this.data.station.connections) {
      this.edgeData.push({
        source: nodeInMap.get(c.source),
        target: nodeOutMap.get(c.target)
      });
    }

    this.nodeInData = Array.from(nodeInMap.values());
    this.nodeOutData = Array.from(nodeOutMap.values());
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

    this.nodeInData = Array.from(nodeInMap.values());
    this.nodeOutData = Array.from(nodeOutMap.values());
  }

  private addNodes() {
    const d3 = this.d3;
    const dragLine = this.dragLine;
    let nodeOut: NodeDatum;

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

    nodesIn.on('mouseover', function () {
      if (dragLine.classed(StationPropertiesComponent.HIDDEN)) {
        d3.select(this).classed(StationPropertiesComponent.HOVER, true);
      }
    }).on('mouseout', function () {
      d3.select(this).classed(StationPropertiesComponent.HOVER, false);
    });

    nodesOut.on('mouseover', function (d) {
      if (!dragLine.classed(StationPropertiesComponent.HIDDEN)) {
        nodeOut = d;
        d3.select(this).classed(StationPropertiesComponent.HOVER, true);
      }
    }).on('mouseout', function () {
      nodeOut = null;
      d3.select(this).classed(StationPropertiesComponent.HOVER, false);
    });

    nodesIn.call(this.d3.drag<SVGElement, NodeDatum>()
      .on('start drag', d => {
        const mousePos = d3.mouse(document.getElementById('in-out-connector'));

        dragLine.attr('d', this.line(d.x + StationPropertiesComponent.NODE_WIDTH / 2, d.y, mousePos[0], mousePos[1]));
        dragLine.classed(StationPropertiesComponent.HIDDEN, false);
      })
      .on('end', d => {
        if (nodeOut != null && this.edgeData.find(e => e.source === d && e.target === nodeOut) == null) {
          this.edgeData.push({
            source: d,
            target: nodeOut
          });
          this.updateEdges();
        }

        dragLine.classed(StationPropertiesComponent.HIDDEN, true);
      }));
  }

  private updateEdges() {
    const edges = this.edgesG.selectAll<SVGElement, EdgeDatum>('path')
      .data(this.edgeData, d => d.source.id + Constants.ARROW_STRING + d.target.id);

    edges.enter().append('path').classed(StationPropertiesComponent.EDGE, true)
      .attr('d', d => {
        const x1 = d.source.x + StationPropertiesComponent.NODE_WIDTH / 2;
        const y1 = d.source.y;
        const x2 = d.target.x - StationPropertiesComponent.NODE_WIDTH / 2;
        const y2 = d.target.y;

        return this.line(x1, y1, x2, y2);
      })
      .on('click', d => {
        this.edgeData.splice(this.edgeData.indexOf(d), 1);
        this.updateEdges();
      });
    edges.exit().remove();
  }

  private line(x1: number, y1: number, x2: number, y2: number) {
    const path = this.d3.path();

    path.moveTo(x1, y1);
    path.lineTo(x2, y2);

    return path.toString();
  }
}
