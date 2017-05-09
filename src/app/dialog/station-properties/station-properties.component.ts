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

const NODE = 'node';
const HOVER = 'hover';
const EDGE = 'edge';
const HIDDEN = 'hidden';

const SVG_WIDTH = 600;
const NODE_PADDING = 15;
const NODE_WIDTH = 200;
const NODE_HEIGHT = 30;

@Component({
  templateUrl: './station-properties.component.html',
  styleUrls: ['./station-properties.component.css']
})
export class StationPropertiesComponent implements OnInit {

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

      let yIn = NODE_PADDING + NODE_HEIGHT / 2;
      let yOut = NODE_PADDING + NODE_HEIGHT / 2;

      for (const n of this.nodeInData) {
        n.x = NODE_WIDTH / 2 + 1;
        n.y = yIn;
        yIn += NODE_HEIGHT + NODE_PADDING;
      }

      for (const n of this.nodeOutData) {
        n.x = SVG_WIDTH - NODE_WIDTH / 2 - 1;
        n.y = yOut;
        yOut += NODE_HEIGHT + NODE_PADDING;
      }

      this.height = Math.max(yIn, yOut) - NODE_HEIGHT / 2;
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
        .attr('width', SVG_WIDTH).attr('height', this.height)
        .on('mouseup', () => this.dragLine.classed(HIDDEN, true));

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

      this.dragLine = g.append<SVGElement>('path').attr('class', EDGE + ' ' + HIDDEN).attr('marker-end', 'url(#end-arrow)');
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
      nodes.classed(NODE, true).attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');
      nodes.append('rect').attr('x', -NODE_WIDTH / 2).attr('y', -NODE_HEIGHT / 2).attr('width', NODE_WIDTH).attr('height', NODE_HEIGHT);
      nodes.append('text').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').text(d => d.title);
    };

    const nodesIn = this.nodesInG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeInData, d => d.id).enter().append<SVGElement>('g');
    const nodesOut = this.nodesOutG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeOutData, d => d.id).enter().append<SVGElement>('g');

    initRectAndText(nodesIn);
    initRectAndText(nodesOut);

    nodesIn.on('mouseover', function () {
      if (dragLine.classed(HIDDEN)) {
        d3.select(this).classed(HOVER, true);
      }
    }).on('mouseout', function () {
      d3.select(this).classed(HOVER, false);
    });

    nodesOut.on('mouseover', function (d) {
      if (!dragLine.classed(HIDDEN)) {
        nodeOut = d;
        d3.select(this).classed(HOVER, true);
      }
    }).on('mouseout', function () {
      nodeOut = null;
      d3.select(this).classed(HOVER, false);
    });

    nodesIn.call(this.d3.drag<SVGElement, NodeDatum>()
      .on('start drag', d => {
        const mousePos = d3.mouse(document.getElementById('in-out-connector'));

        dragLine.attr('d', 'M' + (d.x + NODE_WIDTH / 2) + ',' + d.y + 'L' + mousePos[0] + ',' + mousePos[1]);
        dragLine.classed(HIDDEN, false);
      })
      .on('end', d => {
        if (nodeOut != null && this.edgeData.find(e => e.source === d && e.target === nodeOut) == null) {
          this.edgeData.push({
            source: d,
            target: nodeOut
          });
          this.updateEdges();
        }

        dragLine.classed(HIDDEN, true);
      }));
  }

  private updateEdges() {
    const edges = this.edgesG.selectAll<SVGElement, EdgeDatum>('path')
      .data(this.edgeData, d => d.source.id + Constants.ARROW_STRING + d.target.id);

    edges.enter().append('path').classed(EDGE, true)
      .attr('d', d => 'M' + (d.source.x + NODE_WIDTH / 2) + ',' + d.source.y + 'L' + (d.target.x - NODE_WIDTH / 2) + ',' + d.target.y)
      .on('click', d => {
        this.edgeData.splice(this.edgeData.indexOf(d), 1);
        this.updateEdges();
      });
    edges.exit().remove();
  }
}
