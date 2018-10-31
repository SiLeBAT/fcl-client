import * as _ from 'lodash';

export class Graph {
  
  vertices: Vertex[] = [];
  //vertexCount: number = 0;
  layers: Vertex[][];
  
  insertVertex(vertex: Vertex) {
    vertex.index = this.vertices.length; //   this.vertexCount++;
    this.vertices.push(vertex);
  }
  
  insertEdge(from: Vertex, to: Vertex) {
    //from.outVertices.push(to.index);
    //to.inVertices.push(from.index);
    let edge: Edge = new Edge(from, to, false);
    from.outEdges.push(edge);
    to.inEdges.push(edge);
  }

  invertEdges(edgesToInvert: Edge[]) {
    for(let edge of edgesToInvert) {
      let index: number = edge.source.outEdges.indexOf(edge);
      if (index >= 0) edge.source.outEdges.splice(index, 1);
      index = edge.target.inEdges.indexOf(edge);

      let vertex: Vertex = edge.source;
      edge.source = edge.target;
      edge.target = vertex;

      edge.source.outEdges.push(edge);
      edge.target.inEdges.push(edge);
    }
  }

  resetVertexIndicesInLayers() {
    let iL: number = -1;
    for(let layer of this.layers) {
      let i: number = -1;
      iL++;
      for(let vertex of layer) vertex.setIndexInLayer(++i); // + iL*100;
    }
    //let tmp: number[][] = this.layers.map(l => l.map(v => v.indexInLayer));
  }

  checkIndicesInLayers() {
    for(let vertex of this.vertices) if(vertex.getIndexInLayer()==null) {
      console.log('The indexInLayer of vertex ' + vertex.index.toString() + ' is not defined.' );
    }
  }

  checkInEdgeOutEdgeSymmetry() {
    for(let vertex of this.vertices) {
      for(let edge of vertex.outEdges) {
        if(edge.target.inEdges.findIndex(e => e===edge)<0) console.log('outEdge' + edge.source.index.toString() + '>' + edge.target.index.toString() + ' was not found in inEdges.');
      }
      for(let edge of vertex.inEdges) {
        if(edge.source.outEdges.findIndex(e => e===edge)<0) console.log('inEdge' + edge.source.index.toString() + '>' + edge.target.index.toString() + ' was not found in outEdges.');
      }
    }
  }

  checkVertexIndices() {
    const indices: number[] = this.vertices.map(v => v.index);
    if(_.uniq(indices).length!=this.vertices.length) console.log('inconsistent indices');
    if(Math.max(...indices)!=this.vertices.length-1) console.log('inconsistent indices');
    if(Math.min(...indices)!=0) console.log('inconsistent indices');
  }
}

export class Vertex {
  index: number;
  x: number;
  y: number;
  //inVertices: number[] = [];
  //outVertices: number[] = [];
  inEdges: Edge[] = [];
  outEdges: Edge[] = [];
  layerIndex: number;
  weight: number;
  //nextLayer: Edge[];
  //previousLayer: Edge[];
  private indexInLayer: number;
  typeCode: number;
  isVirtual: boolean = false;
  bottomMargin: number;
  topMargin: number;
  isCompressed: boolean = false;
  constructor() {}
  setIndexInLayer(value: number) {
    if(value==null) {
      value = value;
    }
    this.indexInLayer = value;
  }
  getIndexInLayer(): number {
    return this.indexInLayer;
  }
}

export enum CompressionType {
  SourceCompression = 0 as number,
  TargetCompression = 1 as number
}
export class CompressedVertexGroup {
  compressedVertices: Vertex[];
  type: CompressionType;
}
export class Edge {
  /*source: Vertex;
  target: Vertex;
  isVirtual: boolean;*/
  public weight: number = 1.0;

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