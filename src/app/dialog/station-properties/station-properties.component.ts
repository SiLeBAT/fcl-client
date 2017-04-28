import {Component, Inject, OnInit} from '@angular/core';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
import {D3Service, D3, Selection} from 'd3-ng2-service';

import {Connection, DeliveryData, StationData} from '../../util/datatypes';
import {DataService} from '../../util/data.service';
import {UtilService} from '../../util/util.service';

export interface StationPropertiesData {
  station: StationData;
  connectedDeliveries: DeliveryData[];
}

enum NodeType {IN, OUT}

interface NodeDatum {
  id: string;
  type: NodeType;
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

  private static NODE = 'node';
  private static HOVER = 'hover';

  private static EDGE = 'edge';
  private static HIDDEN = 'hidden';

  private static SVG_WIDTH = 400;
  private static NODE_PADDING = 15;
  private static NODE_WIDTH = 100;
  private static NODE_HEIGHT = 30;

  properties: { name: string, value: string }[];

  private d3: D3;

  private nodeData: NodeDatum[];
  private edgeData: EdgeDatum[];
  private height: number;

  private g: Selection<SVGElement, any, any, any>;
  private defs: Selection<SVGElement, any, any, any>;
  private nodesG: Selection<SVGElement, any, any, any>;
  private edgesG: Selection<SVGElement, any, any, any>;
  private dragLine: Selection<SVGElement, any, any, any>;

  constructor(public dialogRef: MdDialogRef<StationPropertiesComponent>, @Inject(MD_DIALOG_DATA) public data: StationPropertiesData,
              d3Service: D3Service) {
    this.properties = Object.keys(data.station)
      .filter(key => DataService.PROPERTIES.has(key) && key !== 'incoming' && key !== 'outgoing')
      .map(key => {
        return {
          name: DataService.PROPERTIES.get(key).name,
          value: UtilService.stringify(data.station[key])
        };
      }).concat(data.station.properties);
    this.d3 = d3Service.getD3();

    if (data.station.incoming.length > 0 && data.station.outgoing.length > 0) {
      const nodeMap: Map<string, NodeDatum> = new Map();
      let yIn = StationPropertiesComponent.NODE_PADDING + StationPropertiesComponent.NODE_HEIGHT / 2;
      let yOut = StationPropertiesComponent.NODE_PADDING + StationPropertiesComponent.NODE_HEIGHT / 2;

      for (const id of data.station.incoming) {
        const delivery = data.connectedDeliveries.find(d => d.id === id);

        nodeMap.set(id, {
          id: id,
          type: NodeType.IN,
          title: delivery.id,
          x: StationPropertiesComponent.NODE_PADDING + StationPropertiesComponent.NODE_WIDTH / 2,
          y: yIn
        });
        yIn += StationPropertiesComponent.NODE_HEIGHT + StationPropertiesComponent.NODE_PADDING;
      }

      for (const id of data.station.outgoing) {
        const delivery = data.connectedDeliveries.find(d => d.id === id);

        nodeMap.set(id, {
          id: id,
          type: NodeType.OUT,
          title: delivery.id,
          x: StationPropertiesComponent.SVG_WIDTH - StationPropertiesComponent.NODE_PADDING - StationPropertiesComponent.NODE_WIDTH / 2,
          y: yOut
        });
        yOut += StationPropertiesComponent.NODE_HEIGHT + StationPropertiesComponent.NODE_PADDING;
      }

      this.edgeData = [];

      for (const c of data.station.connections) {
        this.edgeData.push({
          source: nodeMap.get(c.source),
          target: nodeMap.get(c.target)
        });
      }

      this.nodeData = Array.from(nodeMap.values());
      this.height = Math.max(yIn, yOut) - StationPropertiesComponent.NODE_HEIGHT / 2;
    }
  }

  //noinspection JSUnusedGlobalSymbols
  close() {
    const connections: Connection[] = this.edgeData.map(edge => {
      return {
        source: edge.source.id,
        target: edge.target.id
      };
    });

    this.dialogRef.close(connections);
  }

  ngOnInit() {
    if (this.height != null) {
      const svg: Selection<SVGElement, any, any, any> = this.d3
        .select('#in-out-connector').append<SVGElement>('svg')
        .attr('width', StationPropertiesComponent.SVG_WIDTH).attr('height', this.height)
        .on('mouseup', () => this.dragLine.classed(StationPropertiesComponent.HIDDEN, true));

      this.defs = svg.append<SVGElement>('defs');
      this.appendArrowToDefs('end-arrow');
      this.appendArrowToDefs('end-arrow-hover');

      this.g = svg.append<SVGElement>('g');
      this.dragLine = this.g.append<SVGElement>('path')
        .attr('class', StationPropertiesComponent.EDGE + ' ' + StationPropertiesComponent.HIDDEN);
      this.edgesG = this.g.append<SVGElement>('g');
      this.nodesG = this.g.append<SVGElement>('g');

      this.addNodes();
      this.updateEdges();
    }
  }

  private appendArrowToDefs(id: string) {
    this.defs.append('marker')
      .attr('id', id)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 7)
      .attr('markerWidth', 3.5)
      .attr('markerHeight', 3.5)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5');
  }

  private addNodes() {
    let hoverD: NodeDatum;
    const updateDragLinePosition = d => {
      const mousePos = this.d3.mouse(document.getElementById('in-out-connector'));

      this.dragLine.attr('d', 'M' + (d.x + 50) + ',' + d.y + 'L' + mousePos[0] + ',' + mousePos[1]);
    };
    const nodes = this.nodesG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeData, d => d.id).enter().append<SVGElement>('g');

    nodes.classed(StationPropertiesComponent.NODE, true)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')').append('rect')
      .attr('x', -StationPropertiesComponent.NODE_WIDTH / 2).attr('y', -StationPropertiesComponent.NODE_HEIGHT / 2)
      .attr('width', StationPropertiesComponent.NODE_WIDTH).attr('height', StationPropertiesComponent.NODE_HEIGHT);

    nodes.each((d, i) => {
      const node = this.d3.select<SVGElement, NodeDatum>(nodes.nodes()[i]);

      node.append('text').attr('text-anchor', 'middle').attr('dy', 5).append('tspan').text(d.title);

      node.on('mouseover', () => {
        hoverD = d;
        node.classed(StationPropertiesComponent.HOVER, true);
      }).on('mouseout', () => {
        hoverD = null;
        node.classed(StationPropertiesComponent.HOVER, false);
      });

      if (node.datum().type === NodeType.IN) {
        node.call(this.d3.drag<SVGElement, NodeDatum>()
          .on('start', () => {
            updateDragLinePosition(d);
            this.dragLine.classed(StationPropertiesComponent.HIDDEN, false);
          })
          .on('drag', updateDragLinePosition)
          .on('end', () => {
            if (hoverD != null && hoverD.type === NodeType.OUT) {
              const newEdge: EdgeDatum = {
                source: d,
                target: hoverD
              };

              if (this.edgeData.find(e => e.source === newEdge.source && e.target === newEdge.target) == null) {
                this.edgeData.push(newEdge);
                this.updateEdges();
              }
            }

            this.dragLine.classed(StationPropertiesComponent.HIDDEN, true);
          }));
      } else {
        node.call(this.d3.drag<SVGElement, NodeDatum>());
      }
    });
  }

  private updateEdges() {
    const edges = this.edgesG.selectAll<SVGElement, EdgeDatum>('path').data(this.edgeData, d => d.source.id + '->' + d.target.id);

    edges.enter().append('path').classed(StationPropertiesComponent.EDGE, true)
      .attr('d', d => 'M' + (d.source.x + 50) + ',' + d.source.y + 'L' + (d.target.x - 50) + ',' + d.target.y)
      .on('click', d => {
        this.edgeData.splice(this.edgeData.indexOf(d), 1);
        this.updateEdges();
      });
    edges.exit().remove();
  }
}
