import {Graph, Vertex, Edge} from './data_structures';
import {BusinessTypeRanker} from './business_type_ranker';

export function removeCycles(graph: Graph, typeRanker: BusinessTypeRanker) {
  let cycleRemover: CycleRemover = new CycleRemover();
  cycleRemover.removeCycles(graph, typeRanker);
}

class CycleRemover {
  //private Stack: Vertex[];
  private isMarked: boolean[];
  private isStacked: boolean[];
  private vertices: Vertex[];
  private removedCycleEdges: Edge[];
  
  constructor() {}
  
  init(graph: Graph) {
    this.vertices = graph.vertices;
    this.removedCycleEdges = [];
    this.isMarked = [];
    this.isStacked = [];
    //this.Stack = [];
    for(let i: number = graph.vertices.length; i>=0; --i) this.isMarked[i] = false;
    for(let i: number = graph.vertices.length; i>=0; --i) this.isStacked[i] = false;
  }
  
  removeCycles(graph: Graph, typeRanker: BusinessTypeRanker) {
    this.init(graph);
    for(let vertex of graph.vertices) this.dfsRemove(vertex);
  }
  
  private dfsRemove(vertex: Vertex) {
    if(this.isMarked[vertex.index]) return;
    
    this.isMarked[vertex.index] = true; //.add(vertex)
    this.isStacked[vertex.index] = true;
    //this.Stack.push(vertex); // = true; //.add(vertex)
    //let removedOutNodes: Set<Vertex> = new Set();
    let reversedOutEdges: Set<Edge> = new Set();
    
    
    for(let iE: number = 0; iE<vertex.outEdges.length; iE++) {
      const outEdge: Edge = vertex.outEdges[iE];
      if (this.isStacked[outEdge.target.index]) {
        // reverse edge
        //removedOutNodes.push(outEdge.target);
        reversedOutEdges.add(outEdge);
      } else if (!this.isMarked[outEdge.target.index]) {
        this.dfsRemove(outEdge.target);
      }
    }
    
    if(reversedOutEdges.size>0) {
      vertex.outEdges = vertex.outEdges.filter(e => !reversedOutEdges.has(e));
      
      reversedOutEdges.forEach(edge => {
        edge.target.inEdges = edge.target.inEdges.filter(e => !reversedOutEdges.has(e));
        //this.removedCycleEdges.push(edge);
      });

      reversedOutEdges.forEach(oldEdge => {
        const newEdge: Edge = new Edge(oldEdge.target, oldEdge.source, false);
        newEdge.source.outEdges.push(newEdge);
        newEdge.target.inEdges.push(newEdge);
      });
    }
  
    this.isStacked[vertex.index] = false;
    //this.Stack.pop();
  }
}