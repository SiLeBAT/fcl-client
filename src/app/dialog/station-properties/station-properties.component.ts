import {Component, Inject, OnInit} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';
import {D3Service, D3, Selection} from 'd3-ng2-service';

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
  private static HOVER = 'hover';

  private static EDGE = 'edge';
  private static HIDDEN = 'hidden';

  properties: { name: string, value: string }[];

  private d3: D3;

  private nodeData: NodeDatum[];
  private edgeData: EdgeDatum[];

  private g: Selection<SVGElement, any, any, any>;
  private defs: Selection<SVGElement, any, any, any>;
  private nodesG: Selection<SVGElement, any, any, any>;
  private edgesG: Selection<SVGElement, any, any, any>;
  private dragLine: Selection<SVGElement, any, any, any>;

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

    const svg: Selection<SVGElement, any, any, any> = this.d3
      .select('#in-out-connector').append<SVGElement>('svg')
      .attr('width', 400).attr('height', 400)
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
    let hoverD;
    const updateDragLinePosition = d => {
      const mousePos = this.d3.mouse(document.getElementById('in-out-connector'));

      this.dragLine.attr('d', 'M' + (d.x + 50) + ',' + d.y + 'L' + mousePos[0] + ',' + mousePos[1]);
    };
    const nodes = this.nodesG.selectAll<SVGElement, NodeDatum>('g').data(this.nodeData, d => d.id).enter().append('g');

    nodes.classed(StationPropertiesComponent.NODE, true)
      .attr('transform', d => 'translate(' + d.x + ',' + d.y + ')').append('circle').attr('r', '50');

    nodes.call(this.d3.drag<Element, NodeDatum>()
      .on('start', d => {
        updateDragLinePosition(d);
        this.dragLine.classed(StationPropertiesComponent.HIDDEN, false);
      })
      .on('drag', updateDragLinePosition)
      .on('end', d => {
        if (hoverD != null && hoverD !== d) {
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

    nodes.each((d, i) => {
      const node = this.d3.select(nodes.nodes()[i]);

      node.append('text').attr('text-anchor', 'middle').append('tspan').text(d.title);
      node.on('mouseover', () => {
        hoverD = d;
        node.classed(StationPropertiesComponent.HOVER, true);
      }).on('mouseout', () => {
        hoverD = null;
        node.classed(StationPropertiesComponent.HOVER, false);
      });
    });
  }

  private updateEdges() {
    const edges = this.edgesG.selectAll<SVGElement, EdgeDatum>('path')
      .data(this.edgeData, d => String(d.source.id) + '+' + String(d.target.id));

    edges.exit().remove();
    edges.enter().append('path').classed(StationPropertiesComponent.EDGE, true)
      .attr('d', d => 'M' + (d.source.x + 50) + ',' + d.source.y + 'L' + (d.target.x - 50) + ',' + d.target.y)
      .on('click', d => {
        this.edgeData.splice(this.edgeData.indexOf(d), 1);
        this.updateEdges();
      });
  }
}
