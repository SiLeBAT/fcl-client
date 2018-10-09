import {Graph, Vertex, Edge} from './data_structures';
import {BusinessTypeRanker} from './business_type_ranker';

export function removeCycles(graph: Graph, typeRanker: BusinessTypeRanker) {
  let cycleRemover: CycleRemover = new CycleRemover();
  cycleRemover.removeCycles(graph, typeRanker);
}

class CycleRemover {
  private Stack: Vertex[];
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
    this.Stack = [];
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
    this.Stack.push(vertex); // = true; //.add(vertex)
    //let removedOutNodes: Set<Vertex> = new Set();
    let removedOutEdges: Set<Edge> = new Set();
    

    for(let outEdge of vertex.outEdges) {
      if (this.isStacked[outEdge.target.index]) {
        // reverse edge
        //removedOutNodes.push(outEdge.target);
        removedOutEdges.add(outEdge);
      } else if (!this.isMarked[outEdge.target.index]) {
        this.dfsRemove(outEdge.target);
      }
    }
    
    if(removedOutEdges.size>0) {
      vertex.outEdges.filter(e => removedOutEdges.has(e));
      //let tmp: Edge[] = removedOutEdges;
      removedOutEdges.forEach(edge => {
        edge.target.inEdges.filter(e => removedOutEdges.has(e));
        this.removedCycleEdges.push(edge);
      }
    );
     
      /*for(let target of removedOutNodes) {
        this.vertices[target].inVertices = this.vertices[target].inVertices.filter(x => x!=source);
        this.removedCycleEdges.push([source, target]);
      }*/
    }

    /*if(removedOutNodes.length>0) {
      this.vertices[source].outVertices = this.vertices[source].outVertices.filter(x => removedOutNodes.indexOf(x) < 0);
      for(let target of removedOutNodes) {
        this.vertices[target].inVertices = this.vertices[target].inVertices.filter(x => x!=source);
        this.removedCycleEdges.push([source, target]);
      }
    }*/
    
    this.isStacked[vertex.index] = false;
    this.Stack.pop();
  }
}