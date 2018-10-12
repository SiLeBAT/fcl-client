// implementation according to:
// according to http://publications.lib.chalmers.se/records/fulltext/161388.pdf
import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './data_structures';
import {removeCycles} from './cycle_remover';
import {assignLayers} from './layer_assigner';
import {sortVertices} from './vertex_sorter';
import {positionVertices} from './vertex_positioner_lp';
import {BusinessTypeRanker} from './business_type_ranker';

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
    
    cy.nodes().forEach(node => {
      let v: Vertex = new Vertex;
      v.typeCode = typeRanker.getBusinessTypeCode(node['data']['typeOfBusiness']);
      vertices.set(node.id(), v);
      graph.insertVertex(v);
    });
    
    cy.edges().forEach(edge => {
      graph.insertEdge(vertices.get(edge.source().id()), vertices.get(edge.target().id()));
    });
    
    const layoutManager: FarmToForkLayouter = new FarmToForkLayouter(graph, typeRanker);
    
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

class FarmToForkLayouter {
  constructor(private graph: Graph, private typeRanker: BusinessTypeRanker) {};
  
  layout(width: number, height: number) {
    this.simplifyGraph();
    this.correctEdges();
    this.simplifyGraph();
    removeCycles(this.graph, this.typeRanker);
    let layers: Vertex[][] = assignLayers(this.graph, this.typeRanker);
    //removeEdgesWithinLayers(this.graph);
    sortVertices(this.graph, layers)
    positionVertices(layers, width, height);
    //this.computePositions();
  }
  
  simplifyGraph() {
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
    /*for(let i: number = 0, n: number = this.graph.vertexCount; i<n; ++i) {
      this.graph.vertices[i].inVertices = Array.from(new Set(this.graph.vertices[i].inVertices)).filter(k => k!=i);
      this.graph.vertices[i].outVertices = Array.from(new Set(this.graph.vertices[i].outVertices)).filter(k => k!=i);
    }*/
  }

  correctEdges() {
    let edgesToInvert: Edge[] = [];
    for(let vertex of this.graph.vertices) for(let edge of vertex.outEdges) if(this.typeRanker.compareRanking(vertex, edge.target)>0) edgesToInvert.push(edge);
    this.graph.invertEdges(edgesToInvert);
  }
}