import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './data_structures';
import {BusinessTypeRanker} from './business_type_ranker';

export function assignLayers(graph: Graph, typeRanker): Vertex[][] {
  let layerAssignment = new LayerAssignment();
  return layerAssignment.assignLayers(graph, typeRanker);
} 

class LayerAssignment {
  
  private vertexOutEdgeCounts: number[];

  constructor() {}
  
  private getForkVertices(graph: Graph): Vertex[] {
    const result: Vertex[] = []; 
    for(let i: number = 0, n: number = this.vertexOutEdgeCounts.length; i<n; ++i) if(this.vertexOutEdgeCounts[i]<1) result.push(graph.vertices[i]);
    return result;
  }

  getIncomingEdges(vertices: Vertex[]): Edge[] {
    /*let result: Edge[] = [];
    for(let vertex of vertices) {
      result = result.concat(vertex.inEdges);
    }*/
    return _.flatten(vertices.map(v => v.inEdges));
    //return result;
  } 
  
  init(graph: Graph) {
    this.vertexOutEdgeCounts = [];
    for(let vertex of graph.vertices) {
      this.vertexOutEdgeCounts[vertex.index] = vertex.outEdges.length;
    }
  }
  
  assignLayers(graph: Graph, typeRanker: BusinessTypeRanker): Vertex[][] {
    //graph.checkInEdgeOutEdgeSymmetry();
    //graph.checkVertexIndices();
    this.init(graph);

    const layers: Vertex[][] = [];
    let sinks: Vertex[] = this.getForkVertices(graph); 
    
    while(sinks.length > 0) {
      let sinkInEdges = this.getIncomingEdges(sinks);
      for(let edge of sinkInEdges) this.vertexOutEdgeCounts[edge.source.index]--;
      
      for(let i: number = sinks.length-1; i>=0; i--) {
        sinks[i].layerIndex = layers.length; 
        sinks[i].setIndexInLayer(i);
      }
      layers.push(sinks);
      
      sinks = [];
      // get new sinks
      for(let edge of sinkInEdges) if(this.vertexOutEdgeCounts[edge.source.index]<1) sinks.push(edge.source);      
      
      sinks = Array.from(new Set(sinks));
    }
    graph.layers = layers;
    //graph.checkIndicesInLayers();
    //graph.resetVertexIndicesInLayers();
    return layers;
  }
  
  
  /*getVerticesWithoutOutgoingEdges(edges: number[]): number[] {
    const result: number[] = [];
    for (let iE = 0, nE = edges.length; iE<nE; iE++) if(this.vertexOutgoingCounts[this.edgeSource[edges[iE]]]==0) result.push(this.edgeSource[edges[iE]]);
    return result;
  }
  
  getVerticesWithoutIncomingEdges(edges: Edge[], vertices: string[]): string[] {
    const targets = _(edges)
    .map(e => e.to)
    .uniq()
    return _(vertices)
    .filter(v => !targets.includes(v))
    .value()
  }*/
  
}
