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

  properties: { name: string, value: string }[];

  constructor(@Inject(MD_DIALOG_DATA) public data: StationPropertiesData) {
    this.properties = Object.keys(data.station).filter(key => DataService.PROPERTIES.has(key)).map(key => {
      return {
        name: DataService.PROPERTIES.get(key).name,
        value: UtilService.stringify(data.station[key])
      };
    }).concat(data.station.properties);
  }

  ngOnInit() {
    this.initD3(window['d3']);
  }

  initD3(d3) {

    // define graphcreator object
    const GraphCreator = function (svg, nodes, edges) {
      const thisGraph = this;
      thisGraph.idct = 0;

      thisGraph.nodes = nodes || [];
      thisGraph.edges = edges || [];

      thisGraph.state = {
        selectedNode: null,
        selectedEdge: null,
        mouseDownNode: null,
        mouseDownLink: null,
        justDragged: false,
        justScaleTransGraph: false,
        lastKeyDown: -1,
        selectedText: null
      };

      // define arrow markers for graph links
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

      thisGraph.svg = svg;
      thisGraph.svgG = svg.append('g')
        .classed(thisGraph.consts.graphClass, true);
      const svgG = thisGraph.svgG;

      // displayed when dragging between nodes
      thisGraph.dragLine = svgG.append('svg:path')
        .attr('class', 'link dragline hidden')
        .attr('d', 'M0,0L0,0')
        .style('marker-end', 'url(#mark-end-arrow)');

      // svg nodes and edges
      thisGraph.paths = svgG.append('g').selectAll('g');
      thisGraph.circles = svgG.append('g').selectAll('g');

      thisGraph.drag = d3.behavior.drag()
        .origin(function (d) {
          return {
            x: d.x,
            y: d.y
          };
        })
        .on('drag', function (args) {
          thisGraph.state.justDragged = true;
          thisGraph.dragmove.call(thisGraph, args);
        })
        .on('dragend', function () {
          // todo check if edge-mode is selected
        });
      svg.on('mousedown', function (d) {
        thisGraph.svgMouseDown.call(thisGraph, d);
      });
      svg.on('mouseup', function (d) {
        thisGraph.svgMouseUp.call(thisGraph, d);
      });
    };

    GraphCreator.prototype.setIdCt = function (idct) {
      this.idct = idct;
    };

    GraphCreator.prototype.consts = {
      selectedClass: 'selected',
      connectClass: 'connect-node',
      circleGClass: 'conceptG',
      graphClass: 'graph',
      activeEditId: 'active-editing',
      BACKSPACE_KEY: 8,
      DELETE_KEY: 46,
      ENTER_KEY: 13,
      nodeRadius: 50
    };

    /* PROTOTYPE FUNCTIONS */

    GraphCreator.prototype.dragmove = function (d) {
      const thisGraph = this;

      thisGraph.dragLine.attr('d', 'M' + d.x + ',' + d.y + 'L' + d3.mouse(thisGraph.svgG.node())[0] + ',' + d3.mouse(this.svgG.node())[1]);
    };

    /* insert svg line breaks: taken from http://stackoverflow.com/questions/13241475/how-do-i-include-newlines-in-labels-in-d3-charts */
    GraphCreator.prototype.insertTitleLinebreaks = function (gEl, title) {
      const words = title.split(/\s+/g),
        nwords = words.length;
      const el = gEl.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '-' + (nwords - 1) * 7.5);

      for (let i = 0; i < words.length; i++) {
        const tspan = el.append('tspan').text(words[i]);
        if (i > 0) {
          tspan.attr('x', 0).attr('dy', '15');
        }
      }
    };


    // remove edges associated with a node
    GraphCreator.prototype.spliceLinksForNode = function (node) {
      const thisGraph = this,
        toSplice = thisGraph.edges.filter(function (l) {
          return (l.source === node || l.target === node);
        });
      toSplice.map(function (l) {
        thisGraph.edges.splice(thisGraph.edges.indexOf(l), 1);
      });
    };

    GraphCreator.prototype.replaceSelectEdge = function (d3Path, edgeData) {
      const thisGraph = this;
      d3Path.classed(thisGraph.consts.selectedClass, true);
      if (thisGraph.state.selectedEdge) {
        thisGraph.removeSelectFromEdge();
      }
      thisGraph.state.selectedEdge = edgeData;
    };

    GraphCreator.prototype.replaceSelectNode = function (d3Node, nodeData) {
      const thisGraph = this;
      d3Node.classed(this.consts.selectedClass, true);
      if (thisGraph.state.selectedNode) {
        thisGraph.removeSelectFromNode();
      }
      thisGraph.state.selectedNode = nodeData;
    };

    GraphCreator.prototype.removeSelectFromNode = function () {
      const thisGraph = this;
      thisGraph.circles.filter(function (cd) {
        return cd.id === thisGraph.state.selectedNode.id;
      }).classed(thisGraph.consts.selectedClass, false);
      thisGraph.state.selectedNode = null;
    };

    GraphCreator.prototype.removeSelectFromEdge = function () {
      const thisGraph = this;
      thisGraph.paths.filter(function (cd) {
        return cd === thisGraph.state.selectedEdge;
      }).classed(thisGraph.consts.selectedClass, false);
      thisGraph.state.selectedEdge = null;
    };

    GraphCreator.prototype.pathMouseDown = function (d3path, d) {
      const thisGraph = this,
        state = thisGraph.state;
      d3.event.stopPropagation();
      state.mouseDownLink = d;

      if (state.selectedNode) {
        thisGraph.removeSelectFromNode();
      }

      const prevEdge = state.selectedEdge;
      if (!prevEdge || prevEdge !== d) {
        thisGraph.replaceSelectEdge(d3path, d);
      } else {
        thisGraph.removeSelectFromEdge();
      }
    };

    // mousedown on node
    GraphCreator.prototype.circleMouseDown = function (d3node, d) {
      const thisGraph = this,
        state = thisGraph.state;
      d3.event.stopPropagation();
      state.mouseDownNode = d;

      // reposition dragged directed edge
      thisGraph.dragLine.classed('hidden', false)
        .attr('d', 'M' + d.x + ',' + d.y + 'L' + d.x + ',' + d.y);
    };

    // mouseup on nodes
    GraphCreator.prototype.circleMouseUp = function (d3node, d) {
      const thisGraph = this,
        state = thisGraph.state,
        consts = thisGraph.consts;
      // reset the states
      d3node.classed(consts.connectClass, false);

      const mouseDownNode = state.mouseDownNode;

      if (!mouseDownNode) {
        return;
      }

      thisGraph.dragLine.classed('hidden', true);

      if (mouseDownNode !== d) {
        // we're in a different node: create new edge for mousedown edge and add to graph
        const newEdge = {
          source: mouseDownNode,
          target: d
        };
        const filtRes = thisGraph.paths.filter(function (dd) {
          if (dd.source === newEdge.target && dd.target === newEdge.source) {
            thisGraph.edges.splice(thisGraph.edges.indexOf(dd), 1);
          }
          return dd.source === newEdge.source && dd.target === newEdge.target;
        });
        if (!filtRes[0].length) {
          thisGraph.edges.push(newEdge);
          thisGraph.updateGraph();
        }
      } else {
        state.justDragged = false;
      }
      state.mouseDownNode = null;
      return;

    }; // end of circles mouseup

    // mousedown on main svg
    GraphCreator.prototype.svgMouseDown = function () {
      this.state.graphMouseDown = true;
    };

    // mouseup on main svg
    GraphCreator.prototype.svgMouseUp = function () {
      const thisGraph = this,
        state = thisGraph.state;
      thisGraph.dragLine.classed('hidden', true);
      state.graphMouseDown = false;
    };

    // call to propagate changes to graph
    GraphCreator.prototype.updateGraph = function () {

      const thisGraph = this,
        consts = thisGraph.consts,
        state = thisGraph.state;

      thisGraph.paths = thisGraph.paths.data(thisGraph.edges, function (d) {
        return String(d.source.id) + '+' + String(d.target.id);
      });
      const paths = thisGraph.paths;
      // update existing paths
      paths.style('marker-end', 'url(#end-arrow)')
        .classed(consts.selectedClass, function (d) {
          return d === state.selectedEdge;
        })
        .attr('d', function (d) {
          return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
        });

      // add new paths
      paths.enter()
        .append('path')
        .style('marker-end', 'url(#end-arrow)')
        .classed('link', true)
        .attr('d', function (d) {
          return 'M' + d.source.x + ',' + d.source.y + 'L' + d.target.x + ',' + d.target.y;
        })
        .on('mousedown', function (d) {
          thisGraph.pathMouseDown.call(thisGraph, d3.select(this), d);
        })
        .on('mouseup', function () {
          state.mouseDownLink = null;
        });

      // remove old links
      paths.exit().remove();

      // update existing nodes
      thisGraph.circles = thisGraph.circles.data(thisGraph.nodes, function (d) {
        return d.id;
      });
      thisGraph.circles.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')';
      });

      // add new nodes
      const newGs = thisGraph.circles.enter()
        .append('g');

      newGs.classed(consts.circleGClass, true)
        .attr('transform', function (d) {
          return 'translate(' + d.x + ',' + d.y + ')';
        })
        .on('mouseover', function () {
          d3.select(this).classed(consts.connectClass, true);
        })
        .on('mouseout', function () {
          d3.select(this).classed(consts.connectClass, false);
        })
        .on('mousedown', function (d) {
          thisGraph.circleMouseDown.call(thisGraph, d3.select(this), d);
        })
        .on('mouseup', function (d) {
          thisGraph.circleMouseUp.call(thisGraph, d3.select(this), d);
        })
        .call(thisGraph.drag);

      newGs.append('circle')
        .attr('r', String(consts.nodeRadius));

      newGs.each(function (d) {
        thisGraph.insertTitleLinebreaks(d3.select(this), d.title);
      });

      // remove old nodes
      thisGraph.circles.exit().remove();
    };

    /**** MAIN ****/

      // initial node data
    const nodes = [{
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
    const edges = [];


    /** MAIN SVG **/
    const svg = d3.select('#in-out-connector').append('svg')
      .attr('width', 400)
      .attr('height', 400);
    const graph = new GraphCreator(svg, nodes, edges);
    graph.setIdCt(2);
    graph.updateGraph();
  }


}
