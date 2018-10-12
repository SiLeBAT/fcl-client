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
    for(let i: number = 0, n: number = this.vertexOutEdgeCounts.length; i<n; ++i) if(this.vertexOutEdgeCounts[i]===0) result.push(graph.vertices[i]);
    return result;
  }
  
  /*getIncomingNodes(vertices: number[]): number[] {
    let result: number[] = [];
    for (let iV = 0, nV = vertices.length; iV < nV; iV++) 
      for (let iE = 0, nE = this.graph.vertices[vertices[iV]].inVertices.length; iE<nE; iE++) result.push(this.graph.vertices[vertices[iV]].inEdges[iE]); 
    return result;
} */

  getIncomingEdges(vertices: Vertex[]): Edge[] {
    let result: Edge[] = [];
    for(let vertex of vertices) {
      result = result.concat(vertex.inEdges);
    }
    return result;
  } 
  
  init(graph: Graph) {
    this.vertexOutEdgeCounts = [];
    for(let vertex of graph.vertices) {
      this.vertexOutEdgeCounts[vertex.index] = graph.vertices[vertex.index].outEdges.length;
    }
  }
  
  assignLayers(graph: Graph, typeRanker: BusinessTypeRanker): Vertex[][] {
    this.init(graph);

    const layers: Vertex[][] = [];
    let sinks: Vertex[] = this.getForkVertices(graph); 
    
    while(sinks.length > 0) {
      let sinkInEdges = this.getIncomingEdges(sinks);
      for(let edge of sinkInEdges) this.vertexOutEdgeCounts[edge.source.index]--;
      
      for(let i: number = sinks.length-1; i>=0; i--) {
        sinks[i].layerIndex = layers.length; 
        sinks[i].indexInLayer = i;
      }
      layers.push(sinks);
      
      sinks = [];
      // get new sinks
      for(let edge of sinkInEdges) if(this.vertexOutEdgeCounts[edge.source.index]===0) sinks.push(edge.source);      
      //for(let i: number = 0, n = sinkEdges.length; i<n; ++i) this.vertexOutgoingCounts[sinkEdges]
      // _.remove(edges, e => _(start).includes(e.from))
      // _.remove(vertices, v => _(start).includes(v))
      // start = this.getVerticesWithoutIncomingEdges(edges, vertices)
      sinks = Array.from(new Set(sinks));
    }
    graph.layers = layers;
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
