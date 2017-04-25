import {Component, Inject, OnInit} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';
import {DeliveryData, StationData} from '../../util/datatypes';
import {DataService} from '../../util/data.service';
import {UtilService} from '../../util/util.service';

export interface StationPropertiesData {
  station: StationData;
  connectedDeliveries: DeliveryData[];
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

  private d3: any;
  private nodes: any[];
  private edges: any[];
  private svg: any;
  private svgG: any;
  private mouseDownNode: any;
  private drag: any;
  private dragLine: any;
  private paths: any;
  private circles: any;

  constructor(@Inject(MD_DIALOG_DATA) public data: StationPropertiesData) {
    this.properties = Object.keys(data.station).filter(key => DataService.PROPERTIES.has(key)).map(key => {
      return {
        name: DataService.PROPERTIES.get(key).name,
        value: UtilService.stringify(data.station[key])
      };
    }).concat(data.station.properties);
  }

  ngOnInit() {
    this.d3 = window['d3'];
    this.nodes = [{
      title: 'in1',
      id: 0,
      x: 100,
      y: 100
    }, {
      title: 'out1',
      id: 1,
      x: 300,
      y: 100
    }];
    this.edges = [];
    const svg = this.d3.select('#in-out-connector').append('svg')
      .attr('width', 400)
      .attr('height', 400);

    const defs = svg.append('svg:defs');
    defs.append('svg:marker')
      .attr('id', 'end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', '32')
      .attr('markerWidth', 3.5)
      .attr('markerHeight', 3.5)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    // define arrow markers for leading arrow
    defs.append('svg:marker')
      .attr('id', 'mark-end-arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 7)
      .attr('markerWidth', 3.5)
      .attr('markerHeight', 3.5)
      .attr('orient', 'auto')
      .append('svg:path')
      .attr('d', 'M0,-5L10,0L0,5');

    this.svg = svg;
    this.svgG = svg.append('g');

    // displayed when dragging between nodes
    this.dragLine = this.svgG.append('svg:path')
      .attr('class', StationPropertiesComponent.EDGE + ' ' + StationPropertiesComponent.HIDDEN)
      .attr('d', 'M0,0L0,0')
      .style('marker-end', 'url(#mark-end-arrow)');

    // svg nodes and edges
    this.paths = this.svgG.append('g').selectAll('g');
    this.circles = this.svgG.append('g').selectAll('g');

    this.drag = this.d3.behavior.drag()
      .origin(d => {
        return {
          x: d.x,
          y: d.y
        };
      })
      .on('drag', d => {
        this.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' +
          this.d3.mouse(this.svgG.node())[0] + ',' + this.d3.mouse(this.svgG.node())[1]);
      })
      .on('dragend', () => {
        this.dragLine.classed(StationPropertiesComponent.HIDDEN, true);
      });
    svg.on('mouseup', () => {
      this.dragLine.classed(StationPropertiesComponent.HIDDEN, true);
    });

    this.updateGraph();
  }

  private updateGraph() {
    this.paths = this.paths.data(this.edges, d => {
      return String(d.source.id) + '+' + String(d.target.id);
    });
    const paths = this.paths;
    // update existing paths
    paths.style('marker-end', 'url(#end-arrow)')
      .attr('d', d => {
        return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
      });

    // add new paths
    paths.enter()
      .append('path')
      .style('marker-end', 'url(#end-arrow)')
      .classed(StationPropertiesComponent.EDGE, true)
      .attr('d', d => {
        return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
      });

    // remove old links
    paths.exit().remove();

    // update existing nodes
    this.circles = this.circles.data(this.nodes, d => {
      return d.id;
    });
    this.circles.attr('transform', d => {
      return 'translate(' + d.x + ',' + d.y + ')';
    });

    // add new nodes
    const newGs = this.circles.enter()
      .append('g');
    const self = this;

    newGs.classed(StationPropertiesComponent.NODE, true)
      .attr('transform', d => {
        return 'translate(' + d.x + ',' + d.y + ')';
      })
      .on('mouseover', function (d) {
        self.d3.select(this).classed(StationPropertiesComponent.CONNECT, true);
      })
      .on('mouseout', function (d) {
        self.d3.select(this).classed(StationPropertiesComponent.CONNECT, false);
      })
      .on('mousedown', d => {
        this.mouseDownNode = d;
        this.dragLine.classed(StationPropertiesComponent.HIDDEN, false)
          .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
      })
      .on('mouseup', function (d) {
        self.d3.select(this).classed(StationPropertiesComponent.CONNECT, false);

        if (self.mouseDownNode != null && self.mouseDownNode !== d) {
          // we're in a different node: create new edge for mousedown edge and add to graph
          const newEdge = {
            source: self.mouseDownNode,
            target: d
          };
          const filtRes = self.paths.filter(dd => {
            if (dd.source === newEdge.target && dd.target === newEdge.source) {
              self.edges.splice(self.edges.indexOf(dd), 1);
            }
            return dd.source === newEdge.source && dd.target === newEdge.target;
          });
          if (!filtRes[0].length) {
            self.edges.push(newEdge);
            self.updateGraph();
          }
        }

        self.mouseDownNode = null;
      })
      .call(self.drag);

    newGs.append('circle').attr('r', '50');

    newGs.each(function (d) {
      const words = d.title.split(/\s+/g), nwords = words.length;
      const el = self.d3.select(this).append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-' + (nwords - 1) * 7.5);

      for (let i = 0; i < words.length; i++) {
        const tspan = el.append('tspan').text(words[i]);
        if (i > 0) {
          tspan.attr('x', 0).attr('dy', '15');
        }
      }
    });

    // remove old nodes
    this.circles.exit().remove();
  }
}
