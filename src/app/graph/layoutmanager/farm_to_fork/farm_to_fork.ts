// implementation according to:
// according to http://publications.lib.chalmers.se/records/fulltext/161388.pdf
import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './data_structures';
import {removeCycles} from './cycle_remover';
import {assignLayers} from './layer_assigner';
import {sortVertices} from './vertex_sorter';
import {positionVertices} from './vertex_positioner_lp';
import {BusinessTypeRanker} from './business_type_ranker';
import {scaleToSize } from './shared';
import {sortAndPosition} from './vertex_sorter_and_positioner';

export function FarmToForkLayout(options) {
  this.options = options;
}

FarmToForkLayout.prototype.run = function () {
  new FarmToForkLayoutClass(this).run();
};

class FarmToForkLayoutClass {
  
  private static DEFAULTS = {
    fit: true
  };
  
  private layout: any;
  private options: any;
  
  constructor(layout: any) {
    this.layout = layout;
    this.options = {};
    
    for (const key of Object.keys(layout.options)) {
      this.options[key] = layout.options[key];
    }
    
    for (const key of Object.keys(FarmToForkLayoutClass.DEFAULTS)) {
      if (!this.options.hasOwnProperty(key)) {
        this.options[key] = FarmToForkLayoutClass.DEFAULTS[key];
      }
    }
  }
  
  run() {
    const cy = this.options.cy;
    const width: number = cy.width();
    const height: number = cy.height();
    const graph = new Graph();
    const vertices: Map<string, Vertex> = new Map();
    const typeRanker: BusinessTypeRanker = new BusinessTypeRanker([],[],[]);
    let tmpH: [number, number] = [100000,-100000];
    let tmpV: [number, number] = [100000,-100000];
    cy.nodes().forEach(node => {
      let v: Vertex = new Vertex;
      v.typeCode = typeRanker.getBusinessTypeCode(node['data']['typeOfBusiness']);
      v.size = node.height();
      //v.topMargin = node.height()/2;
      //v.bottomMargin = v.topMargin;
      vertices.set(node.id(), v);
      graph.insertVertex(v);
      tmpH = [Math.min(node.data('position').x, tmpH[0]), Math.max(node.data('position').x, tmpH[1])];
      tmpV = [Math.min(node.data('position').y, tmpV[0]), Math.max(node.data('position').y, tmpV[1])];
    });
    
    const vertexDistance: number = Math.min(...graph.vertices.map(v=>v.size));
    cy.edges().forEach(edge => {
      graph.insertEdge(vertices.get(edge.source().id()), vertices.get(edge.target().id()));
    });
    
    const layoutManager: FarmToForkLayouter = new FarmToForkLayouter(graph, typeRanker);
    
    layoutManager.layout(width, height, vertexDistance);
    
    cy.nodes().layoutPositions(this.layout, this.options, node => {
      const vertex = vertices.get(node.id());
      
      
      return {
        x: vertex.x,
        y: vertex.y
      };
    });
    
    if (this.options.fit) {
      //cy.fit();
    }
  }
}

class FarmToForkLayouter {
  constructor(private graph: Graph, private typeRanker: BusinessTypeRanker) {};
  
  layout(width: number, height: number, vertexDistance: number) {
    this.simplifyGraph();
    this.correctEdges();
    this.simplifyGraph();
    let startTime: Date = new Date();
    removeCycles(this.graph, this.typeRanker);
    let endTime: Date = new Date();
    console.log('removeCycles: ' + (endTime.getMilliseconds() - startTime.getMilliseconds()).toString() + ' ms');
    this.simplifyGraph();
    startTime = new Date();
    assignLayers(this.graph, this.typeRanker);
    endTime = new Date();
    console.log('assignLayers: ' + (endTime.getMilliseconds() - startTime.getMilliseconds()).toString() + ' ms');
    //removeEdgesWithinLayers(this.graph);
    startTime = new Date();
    sortAndPosition(this.graph, vertexDistance);
    //sortVertices(this.graph);
    endTime = new Date();
    console.log('sortVertices: ' + (endTime.getMilliseconds() - startTime.getMilliseconds()).toString() + ' ms');
    startTime = new Date();
    //positionVertices(this.graph.layers, vertexDistance);
    endTime = new Date();
    console.log('positionVertices: ' + (endTime.getMilliseconds() - startTime.getMilliseconds()).toString() + ' ms');
    scaleToSize(this.graph, width, height);
    //this.computePositions();
  }
  
  /*simplifyGraph() {
    let edges: Edge[] = [];
    for(let vertex of this.graph.vertices) {
      edges = edges.concat(edges, vertex.outEdges);
      vertex.outEdges = [];
      vertex.inEdges = [];
    }
    edges = _.uniqWith(edges, (a,b) => {return a.source===b.source && a.target===b.target});
    for(let edge of edges) {
      edge.source.outEdges.push(edge); 
      edge.target.inEdges.push(edge);
    }
  }*/

  simplifyGraph() {
    let edges: Edge[] = [];
    for(let vertex of this.graph.vertices) vertex.inEdges = [];
    for(let vertex of this.graph.vertices) {
       const targets = _.uniq(vertex.outEdges.map(e => e.target.index)).filter(i => i!=vertex.index);
       const oldEdges: Edge[] = vertex.outEdges;
       vertex.outEdges = [];
       for(let iTarget of targets) {
         const newEdge: Edge = new Edge(vertex, this.graph.vertices[iTarget], false);
         newEdge.weight = 0;
         for(let edge of oldEdges) if(edge.target.index===iTarget) {
           newEdge.weight+= edge.weight;
          }
         vertex.outEdges.push(newEdge);
         newEdge.target.inEdges.push(newEdge);
       }
    }
  }

  correctEdges() {
    let edgesToInvert: Edge[] = [];
    for(let vertex of this.graph.vertices) for(let edge of vertex.outEdges) if(this.typeRanker.compareRanking(vertex, edge.target)>0) edgesToInvert.push(edge);
    this.graph.invertEdges(edgesToInvert);
  }
}