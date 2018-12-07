import * as _ from 'lodash';

export class Graph {
    vertices: Vertex[] = [];
  // vertexCount: number = 0;
    layers: Vertex[][];

    insertVertex(vertex: Vertex) {
        vertex.index = this.vertices.length; //   this.vertexCount++;
        this.vertices.push(vertex);
    }

    insertEdge(from: Vertex, to: Vertex) {
    // from.outVertices.push(to.index);
    // to.inVertices.push(from.index);
        // tslint:disable-next-line
        const edge: Edge = new Edge(from, to, false);
        from.outEdges.push(edge);
        to.inEdges.push(edge);
    }

    invertEdges(edgesToInvert: Edge[]) {
        for (const edge of edgesToInvert) {
            let index: number = edge.source.outEdges.indexOf(edge);
            if (index >= 0) {
                edge.source.outEdges.splice(index, 1);
            }
            index = edge.target.inEdges.indexOf(edge);

            const vertex: Vertex = edge.source;
            edge.source = edge.target;
            edge.target = vertex;

            edge.source.outEdges.push(edge);
            edge.target.inEdges.push(edge);
        }
    }

    resetVertexIndicesInLayers() {
        let iL: number = -1;
        for (const layer of this.layers) {
            let i: number = -1;
            iL++;
            for (const vertex of layer) {
                vertex.indexInLayer = ++i;
            } // + iL*100;
        }
    // let tmp: number[][] = this.layers.map(l => l.map(v => v.indexInLayer));
    }

    checkIndicesInLayers() {
        for (const vertex of this.vertices) {
            if (vertex.indexInLayer == null) {
        //         console.log(
        //   'The indexInLayer of vertex ' +
        //     vertex.index.toString() +
        //     ' is not defined.'
        // );
            }
        }
    }

    checkInEdgeOutEdgeSymmetry() {
        for (const vertex of this.vertices) {
            for (const edge of vertex.outEdges) {
                if (edge.target.inEdges.findIndex(e => e === edge) < 0) {
          //           console.log(
          //   'outEdge' +
          //     edge.source.index.toString() +
          //     '>' +
          //     edge.target.index.toString() +
          //     ' was not found in inEdges.'
          // );
                }
            }
            for (const edge of vertex.inEdges) {
                if (edge.source.outEdges.findIndex(e => e === edge) < 0) {
          //           console.log(
          //   'inEdge' +
          //     edge.source.index.toString() +
          //     '>' +
          //     edge.target.index.toString() +
          //     ' was not found in outEdges.'
          // );
                }
            }
        }
    }

    checkVertexIndices() {
        const indices: number[] = this.vertices.map(v => v.index);
        if (_.uniq(indices).length !== this.vertices.length) {
      // console.log('inconsistent indices');
        }
        if (Math.max(...indices) !== this.vertices.length - 1) {
      // console.log('inconsistent indices');
        }
        if (Math.min(...indices) !== 0) {
            // console.log('inconsistent indices');
        }
    }
}

export class Vertex {
    index: number;
    name: string;
    x: number;
    y: number;
    inEdges: Edge[] = [];
    outEdges: Edge[] = [];
    layerIndex: number;
    weight: number;
    indexInLayer: number;
    typeCode: number;
    isVirtual: boolean = false;
  // bottomMargin: number;
  // topMargin: number;
    size: number = 0;
  // isCompressed: boolean = false;
    constructor() {}
  /*setIndexInLayer(value: number) {
    if(value==null) {
      value = value;
    }
    this.indexInLayer = value;
  }
  getIndexInLayer(): number {
    return this.indexInLayer;
  }*/
}

export enum CompressionType {
  SOURCE_COMPRESSION = 0 as number,
  TARGET_COMPRESSION = 1 as number,
  SIMPLE_CONNECTED_COMPONENT = 2 as number
}
export class CompressedVertexGroup extends Vertex {
    constructor(
    public compressedVertices: Vertex[],
    public compressionType: CompressionType
  ) {
        super();
    }
}

export class Edge {
  /*source: Vertex;
  target: Vertex;
  isVirtual: boolean;*/
    weight: number = 1.0;

    constructor(
    public source: Vertex,
    public target: Vertex,
    public isVirtual: boolean
  ) {
        if (isVirtual == null) {
            isVirtual = false;
        }
    }
}

export class VertexCounter {
    private positionCount: Map<number, number> = new Map();
    private positions: number[] = [];
    private lastPositionRequest: number = -1;
    private lastAboveIndex: number = -1;
    private lastVertexCountRequest: number = -1;

    constructor() {}
    insertVertex(position: number) {
        if (this.positionCount.has(position)) {
            this.positionCount.set(position, this.positionCount.get(position) + 1);
        } else {
            let index: number = this.positions.findIndex(x => x > position);
            if (index < 0) {
                index = this.positions.push(position) - 1;
            } else {
                this.positions.splice(index, 0, position);
            }
            this.positionCount.set(position, 1);
            if (index < this.lastAboveIndex) {
                this.lastAboveIndex++;
            }
        }
        if (this.lastPositionRequest > position) {
            this.lastVertexCountRequest++;
        }
    }

    getVertexCountAbovePosition(position: number): number {
        if (position === this.lastPositionRequest) {
            return this.lastVertexCountRequest;
        }

        let index: number =
      position > this.lastPositionRequest && this.lastAboveIndex >= 0
        ? this.lastAboveIndex
        : 0;
        const n: number = this.positions.length;
        while (index < n && this.positions[index] <= position) {
            index++;
        }

        let result: number = 0;
        for (let i: number = n - 1; i >= index; i--) {
            result += this.positionCount.get(this.positions[i]);
        }

        this.lastPositionRequest = position;
        this.lastAboveIndex = index;
        this.lastVertexCountRequest = result;

        return result;
    }
}
