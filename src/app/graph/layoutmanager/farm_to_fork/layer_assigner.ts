import {Graph, Vertex} from './data_structures';

export function assignLayers(dag: Graph): number[][] {
  let layerAssignment = new LayerAssignment(dag);
  return layerAssignment.assignLayers();
} 

class LayerAssignment {
  //private vertices: Vertex[];
  //private vertexIncomings: number[][];
  private vertexOutgoingCounts: number[];
  //private edgeSource: number[];
  //private edges: Set<Edge>;
  
  constructor(private graph: Graph) {
    
  }
  
  getForkVertices(): number[] {
    const result: number[] = []; 
    for(let i: number = 0, n: number = this.vertexOutgoingCounts.length; i<n; ++i) if(this.vertexOutgoingCounts[i]==0) result.push(i);
    return result;
  }
  
  getIncomingNodes(vertices: number[]): number[] {
    let result: number[] = [];
    for (let iV = 0, nV = vertices.length; iV < nV; iV++) 
      for (let iE = 0, nE = this.graph.vertices[vertices[iV]].inVertices.length; iE<nE; iE++) result.push(this.graph.vertices[vertices[iV]].inEdges[iE]); 
    return result;
  } 
  
  init() {
    this.vertexOutgoingCounts = [];
    for(let i=0, n = this.graph.vertices.length; i<n; ++i) this.vertexOutgoingCounts[i] = this.graph.vertices[i].outEdges.length;
  }
  
  assignLayers(): number[][] {
    const layers: number[][] = [];
    this.init();
    
    let sinks: number[] = this.getForkVertices(); //    this.getVerticesWithoutIncomingEdges(edges, vertices)
    
    while(sinks.length > 0) {
      let sinkInNodes: number[];
      // get InNodes
      sinkInNodes = getIncomingNodes(sinks); // this array might contain duplicates
      // decrease outcount of in nodes
      for(let i: number = 0, n = sinkInNodes.length; i<n; ++i) this.vertexOutCounts[sinkInNodes[i]]--;
      
      layers.push(sinks);
      
      sinks = [];
      // get new sinks
      for(let i: number = 0, n = sinkInNodes.length; i<n; ++i) if(this.vertexOutCounts[sinkInNodes[i]]==0) sinks.push(sinkInNodes[i]);
      
      
      //for(let i: number = 0, n = sinkEdges.length; i<n; ++i) this.vertexOutgoingCounts[sinkEdges]
      // _.remove(edges, e => _(start).includes(e.from))
      // _.remove(vertices, v => _(start).includes(v))
      // start = this.getVerticesWithoutIncomingEdges(edges, vertices)
    }
    return layers;
  }
  
  
  getVerticesWithoutOutgoingEdges(edges: number[]): number[] {
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
  }
  
}
