import {Graph, Vertex} from './data_structures';

export function removeCycles(graph: Graph) {
  let cycleRemover: CycleRemover = new CycleRemover(this.graph);
  cycleRemover.removeCycles(this.graph);
}

class CycleRemover {
  private isStacked: boolean[];
  private isMarked: boolean[];
  private vertices: Vertex[];
  private removedCycleEdges: number[][];
  
  constructor(private graph: Graph) {
    
  }
  
  init(graph: Graph) {
    this.vertices = graph.vertices;
    this.removedCycleEdges = [];
    for(let i: number = graph.vertices.length; i>=0; --i) this.isMarked[i] = false;
    for(let i: number = graph.vertices.length; i>=0; --i) this.isStacked[i] = false;
  }
  
  removeCycles(graph: Graph) {
    this.init(graph);
    for(let i: number = 0, n: number = graph.vertexCount; i<n; ++i) this.dfsRemove(i);
  }
  
  private dfsRemove(source: number) {
    if(this.isMarked[source]) return;
    
    this.isMarked[source] = true; //.add(vertex)
    this.isStacked[source] = true; //.add(vertex)
    let removedOutNodes: number[] = [];
    
    for (let iTarget: number = 0, nTargets: number =  this.vertices[source].outVertices.length; iTarget < nTargets; ++iTarget) { 
      let target: number = this.vertices[source].outVertices[iTarget];
      if (this.isStacked[target]) {
        // reverse edge
        removedOutNodes.push(target);
      } else if (!this.isMarked[target]) {
        this.dfsRemove(target);
      }
    }
    
    if(removedOutNodes.length>0) {
      this.vertices[source].outVertices = this.vertices[source].outVertices.filter(x => removedOutNodes.indexOf(x) < 0);
      for(let target of removedOutNodes) {
        this.vertices[target].inVertices = this.vertices[target].inVertices.filter(x => x!=source);
        this.removedCycleEdges.push([source, target]);
      }
    }
    
    this.isStacked[source] = false;
  }
}