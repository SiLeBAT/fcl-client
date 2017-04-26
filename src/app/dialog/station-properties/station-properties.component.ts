import {Component, Inject, OnInit} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';
import {D3Service, D3} from 'd3-ng2-service';

import {DeliveryData, StationData} from '../../util/datatypes';
import {DataService} from '../../util/data.service';
import {UtilService} from '../../util/util.service';

export interface StationPropertiesData {
  station: StationData;
  connectedDeliveries: DeliveryData[];
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

  private static NODE = 'node';
  private static CONNECT = 'connect';

  private static EDGE = 'edge';
  private static HIDDEN = 'hidden';

  properties: { name: string, value: string }[];

  private d3: D3;

  private nodeData: NodeDatum[];
  private edgeData: EdgeDatum[];
  private overNode: NodeDatum;

  private defs: any;
  private nodes: any;
  private edges: any;
  private dragLine: any;

  constructor(@Inject(MD_DIALOG_DATA) public data: StationPropertiesData, d3Service: D3Service) {
    this.properties = Object.keys(data.station).filter(key => DataService.PROPERTIES.has(key)).map(key => {
      return {
        name: DataService.PROPERTIES.get(key).name,
        value: UtilService.stringify(data.station[key])
      };
    }).concat(data.station.properties);
    this.d3 = d3Service.getD3();
  }

  ngOnInit() {
    this.nodeData = [{
      id: '0',
      title: 'in1',
      x: 100,
      y: 100
    }, {
      id: '1',
      title: 'out1',
      x: 300,
      y: 100
    }];
    this.edgeData = [];

    const svg = this.d3.select('#in-out-connector').append('svg')
      .attr('width', 400)
      .attr('height', 400);

    this.defs = svg.append('svg:defs');
    this.appendArrowToDefs('end-arrow');
    this.appendArrowToDefs('end-arrow-hover');

    const svgG = svg.append('g');

    this.dragLine = svgG.append('svg:path')
      .attr('class', StationPropertiesComponent.EDGE + ' ' + StationPropertiesComponent.HIDDEN);
    this.edges = svgG.append('g').selectAll('g');
    this.nodes = svgG.append('g').selectAll('g');

    svg.on('mouseup', () => this.dragLine.classed(StationPropertiesComponent.HIDDEN, true));

    this.updateGraph();
  }

  private updateGraph() {
    this.edges = this.edges.data(this.edgeData, d => String(d.source.id) + '+' + String(d.target.id));

    // update existing paths
    this.edges.attr('d', d => 'M' + d.source.x + ',' + d.source.y + 'L' + (d.target.x - 50) + ',' + d.target.y);

    // add new paths
    this.edges.enter().append('path').classed(StationPropertiesComponent.EDGE, true)
      .attr('d', d => 'M' + d.source.x + ',' + d.source.y + 'L' + (d.target.x - 50) + ',' + d.target.y);

    // remove old links
    this.edges.exit().remove();

    // update existing nodes
    this.nodes = this.nodes.data(this.nodeData, d => d.id);
    this.nodes.attr('transform', d => 'translate(' + d.x + ',' + d.y + ')');

    // add new nodes
    const newGs = this.nodes.enter().append('g');

    newGs.classed(StationPropertiesComponent.NODE, true)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')').append('circle').attr('r', '50');

    newGs.call(this.d3.drag<Element, NodeDatum>()
      .on('start', d => {
        this.dragLine.classed(StationPropertiesComponent.HIDDEN, false).attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
      })
      .on('drag', d => {
        const mousePos = this.d3.mouse(document.getElementById('in-out-connector'));

        this.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + mousePos[0] + ',' + mousePos[1]);
      })
      .on('end', d => {
        if (this.overNode != null && this.overNode !== d) {
          const newEdge: EdgeDatum = {
            source: d,
            target: this.overNode
          };

          if (this.edgeData.find(e => e.source === newEdge.source && e.target === newEdge.target) == null) {
            this.edgeData.push(newEdge);
            this.updateGraph();
          }
        }

        this.dragLine.classed(StationPropertiesComponent.HIDDEN, true);
      }));

    newGs.each((d, i) => {
      const node = this.d3.select(newGs.nodes()[i]);

      node.append('text').attr('text-anchor', 'middle').append('tspan').text(d.title);
      node.on('mouseover', () => {
        this.overNode = d;
        node.classed(StationPropertiesComponent.CONNECT, true);
      }).on('mouseout', () => {
        this.overNode = null;
        node.classed(StationPropertiesComponent.CONNECT, false);
      });
    });

    this.nodes.exit().remove();
  }

  private appendArrowToDefs(id: string) {
    this.defs.append('svg:marker')
      .attr('id', id)
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 7)
      .attr('markerWidth', 3.5)
      .attr('markerHeight', 3.5)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');
  }
}
