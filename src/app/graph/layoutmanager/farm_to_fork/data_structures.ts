export class Graph {
  
  vertices: Vertex[] = [];
  vertexCount: number = 0;
  
  insertVertex(vertex: Vertex) {
    vertex.index = this.vertexCount++;
    this.vertices.push(vertex);
  }
  
  insertEdge(from: Vertex, to: Vertex) {
    from.outVertices.push(to.index);
    to.inVertices.push(from.index);
    let edge: Edge = new Edge(from, to, false);
    from.outEdges.push(edge);
    to.inEdges.push(edge);
  }
}

export class Vertex {
  index: number;
  x: number;
  y: number;
  inVertices: number[] = [];
  outVertices: number[] = [];
  inEdges: Edge[] = [];
  outEdges: Edge[] = [];
  layerIndex: number;
  weight: number;
  nextLayer: Edge[];
  previousLayer: Edge[];
  indexInLayer: number;
  typeCode: number;
  isVirtual: boolean;
  constructor() {}
}

export class Edge {
  /*source: Vertex;
  target: Vertex;
  isVirtual: boolean;*/

  constructor(public source: Vertex, public target: Vertex, public isVirtual: boolean){
    if(isVirtual==null) isVirtual = false;
  }
}

export class VertexCounter {
  private positionCount: Map<number,number> = new Map();
  private positions: number[] = [];
  private lastPositionRequest: number = -1;
  private lastAboveIndex: number = -1;
  private lastVertexCountRequest: number = -1;
  
  constructor(){}
  insertVertex(position: number) {
    if(this.positionCount.has(position)) {
      this.positionCount.set(position, this.positionCount.get(position)+1);
    } else {
      let index: number = this.positions.findIndex(x => x>position);
      if(index<0) index = this.positions.push(position) - 1;
      else this.positions.splice(index, 0, position);
      this.positionCount.set(position, 1);
      if(index < this.lastAboveIndex) this.lastAboveIndex++;  
    }
    if(this.lastPositionRequest>position) this.lastVertexCountRequest++;
  }

  getVertexCountAbovePosition(position: number): number {
    if(position == this.lastPositionRequest) return this.lastVertexCountRequest;

    let index: number = (position>this.lastPositionRequest && this.lastAboveIndex>=0 ?  this.lastAboveIndex : 0);  
    let n: number = this.positions.length;
    while(index<n && this.positions[index]<=position) index++;

    let result: number = 0;
    for(let i: number = n-1; i>=index; i--) result+= this.positionCount.get(this.positions[i]);

    this.lastPositionRequest = position;
    this.lastAboveIndex = index;
    this.lastVertexCountRequest = result;

    return result;
  }

}