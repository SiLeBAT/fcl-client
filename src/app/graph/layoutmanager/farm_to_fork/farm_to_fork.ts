// implementation according to:
// according to http://publications.lib.chalmers.se/records/fulltext/161388.pdf

import {Graph, Vertex} from './data_structures';
import {removeCycles} from './cycle_remover';
import {assignLayers} from './layer_assigner';

export function FarmToFork(options) {
  this.options = options;
}

FarmToFork.prototype.run = function () {
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
    
    cy.nodes().forEach(node => {
      let v: Vertex = new Vertex;
      vertices.set(node.id(), v);
      graph.insertVertex(v);
    });
    
    cy.edges().forEach(edge => {
      graph.insertEdge(vertices.get(edge.source().id()), vertices.get(edge.target().id()));
    });
    
    const layoutManager: LayeredDirectedGraphLayout = new LayeredDirectedGraphLayout(graph);
    
    layoutManager.layout(width, height);
    
    cy.nodes().layoutPositions(this.layout, this.options, node => {
      const vertex = vertices.get(node.id());
      
      
      return {
        x: vertex.x,
        y: vertex.y
      };
    });
    
    if (this.options.fit) {
      cy.fit();
    }
  }
}

class NodePositioner {
  private static const MIN_SIBLING_DIST: number = 1;
  private static const MIN_NONSIBLING_DIST: number = 4;
  private static const MIN_NODE_TO_EDGE_DIST: number = 2;
  private static const MIN_EDGE_TO_EDGE_DIST: number = 1;
  
  private nodePos: number[];
  private nodeDist: number[];
  private nodeWeight: number[];
  private layers: number[][];
  private vertices: Vertex[];
  private maxNonCrossingVertexIndex: number;
  
  constructor() {}
  
  init() {
    // init node Positions
    for(let iL: number = 0, nL = this.layers.length; iL<nL; iL++) {
      let nV: number = this.layers[iL].length;
      let currentVIndex: number;
      if(nV>0) {
        currentVIndex = this.layers[iL][0];
        this.nodePos[currentVIndex] = 0;
        this.nodeDist[currentVIndex] = 0;
      }
      let oldVIndex: number;
      for(let iV: number = 1; iV<nV; ++iV) {
        oldVIndex = currentVIndex;
        currentVIndex = this.layers[iL][iV];
        if(currentVIndex > this.maxNonCrossingVertexIndex) { // crossingNode
          if(oldVIndex > this.maxNonCrossingVertexIndex) {  // previous node in the layer is crossing node to
            this.nodeDist[currentVIndex] = NodePositioner.MIN_EDGE_TO_EDGE_DIST;
          } else {
            this.nodeDist[currentVIndex] = NodePositioner.MIN_NODE_TO_EDGE_DIST;
          }
        } else {
          if((this.vertices[currentVIndex].inVertices.some(r=> this.vertices[oldVIndex].inVertices.indexOf(r) >= 0)) ||
            (this.vertices[currentVIndex].outVertices.some(r=> this.vertices[oldVIndex].outVertices.indexOf(r) >= 0))) { // do the neighbours share a source or a target
            this.nodeDist[currentVIndex] = NodePositioner.MIN_SIBLING_DIST;
          } else {
            this.nodeDist[currentVIndex] = NodePositioner.MIN_NONSIBLING_DIST;
          }
        }
        this.nodePos[currentVIndex] = this.nodePos[oldVIndex] + this.nodeDist[currentVIndex];
      }
    }
  }
  
  refinePositions() {
    for(let iR: number = 1, nR: number = this.layers.length; iR<nR; iR++) {
      for(let iL: number = 0, nL: number = this.layers.length; iL<nL; iL++) {
        for(let iV: number = 0, nV: number = this.layers[iL].length; iV<nV; ++iV) {
          let currentVIndex = this.layers[iL][iV];
          let posSum: number = 0;
          let weightSum: number = 0;
          // Todo: apply median concept because it is more robust
          for(let iInV: number = 0, nInV: number = this.vertices[currentVIndex].inVertices.length; iInV<nInV; iInV++) {
            let w: number = this.nodeWeight[this.vertices[currentVIndex].inVertices[iInV]];
            posSum+= this.nodePos[this.vertices[currentVIndex].inVertices[iInV]] * w; 
            weightSum+= w;
          }
          for(let iOutV: number = 0, nOutV: number = this.vertices[currentVIndex].outVertices.length; iOutV<nOutV; iOutV++) {
            let w: number = this.nodeWeight[this.vertices[currentVIndex].outVertices[iOutV]];
            posSum+= this.nodePos[this.vertices[currentVIndex].outVertices[iOutV]] * w; 
            weightSum+= w;
          }
          let newPos: number = posSum/weightSum;
          if(iV>0) this.nodePos[currentVIndex] = Math.max(this.nodePos[this.layers[iL][iV-1]]+this.nodeDist[currentVIndex], newPos);
          else this.nodePos[currentVIndex] = newPos;
        }
      }
    }
  }
}


class LayeredDirectedGraphLayout {
  constructor(private graph: Graph) {};
  
  layout(width: number, height: number) {
    this.simplifyGraph();
    removeCycles(this.graph);
    assignLayers(this.graph);
    this.orderVertices();
    this.computePositions();
  }
  
  simplifyGraph() {
    for(let i: number = 0, n: number = this.graph.vertexCount; i<n; ++i) {
      this.graph.vertices[i].inVertices = Array.from(new Set(this.graph.vertices[i].inVertices)).filter(k => k!=i);
      this.graph.vertices[i].outVertices = Array.from(new Set(this.graph.vertices[i].outVertices)).filter(k => k!=i);
    }
  }
  
  removeCycles() {
    let cycleRemover: CycleRemover = new CycleRemover(this.graph);
    cycleRemover.removeCycles(this.graph);
  }
  
  2: 
  
  
  assignToLayers() {
    
  }
  
  orderVertices() {
    
  }
  
  
}