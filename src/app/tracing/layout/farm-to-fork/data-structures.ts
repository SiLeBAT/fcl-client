import * as _ from 'lodash';

export class Graph {
    vertices: Vertex[] = [];
    layers: Vertex[][];

    insertVertex(vertex: Vertex) {
        vertex.index = this.vertices.length;
        this.vertices.push(vertex);
    }

    insertEdge(from: Vertex, to: Vertex) {
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
            }
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

    size: number = 0;

    constructor() {}
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
