import * as _ from 'lodash';
import { Graph, Vertex, Edge, CompressedVertexGroup } from './data_structures';

const HORIZONTAL_MARGIN = 0.1;

export function scaleToSize(graph: Graph, width: number, height: number, vertexDistance: number) {
    const vertices: Vertex[] = graph.vertices.filter(v => !v.isVirtual && !(v instanceof CompressedVertexGroup));
    let maxSize: number = Math.max(...vertices.map(v => v.y + v.size / 2));
    /*const maxSize: number = Math.max(...graph.layers.map(layer =>
        (layer.length > 0 ? layer[layer.length - 1].y + layer[layer.length - 1].size / 2 : 0)));
    */
    const MAX_SCALE = 2;
    const scale = Math.max(1, Math.min(MAX_SCALE, height / maxSize));
    maxSize *= scale;

    if (maxSize > height) {
        // fit width
        width = maxSize / height * width;
    } else {
        // vertical centering
        const voffset: number = (height - maxSize) / 2;
        for (const layer of graph.layers) {
            for (const vertex of layer) {
                vertex.y = vertex.y * scale + voffset;
            }
        }
    }

    const default_hoffset: number = width * HORIZONTAL_MARGIN;
    const maxNeighbourDistance: number = getMaxNeighbourDistance(vertices);

    const layerDistance: number = Math.min(
        (width - 2 * default_hoffset) / (graph.layers.length - 1), // layerDistance based on width and layer count
        Math.max(vertexDistance * 4, // default layerDistance
            maxNeighbourDistance * 1.5 // layerDistance based on NeighbourDistance
            ));

    const hoffset: number = (width - layerDistance * (graph.layers.length - 1)) / 2;

    for (const vertex of vertices) { vertex.x = width - hoffset - vertex.layerIndex * layerDistance; }
    /*for (let iLayer: number = graph.layers.length - 1; iLayer >= 0; iLayer--) {
        const x: number = width - hoffset - iLayer * layerDistance;
        for (const vertex of graph.layers[iLayer]) { vertex.x = x; }
    }*/
}

function getMaxNeighbourDistance(vertices: Vertex[]): number {
    const vertexCount: number = vertices.length;

    const distances: number[] = _.fill(Array(vertexCount), 0);
    for (let iV = 0; iV < vertexCount; iV++) {
        const vertex: Vertex = vertices[iV];

        const neighbours: Vertex[] = [].concat(
            vertex.inEdges.map(e => getNonVirtualSource(e.source)),
            vertex.outEdges.map(e => getNonVirtualTarget(e.target)))
            .filter(v => v.index < vertexCount);

        for (const neighbour of neighbours) {
            distances[neighbour.index] = Math.max(
                distances[neighbour.index],
                Math.abs(neighbour.y - vertex.y) / Math.abs(vertex.layerIndex - neighbour.layerIndex)
                );
        }
    }
    return Math.max(...distances);
}

export function createVirtualVertices(graph: Graph) {
    for (const layer of graph.layers) {
        for (const vertex of layer) {
            for (const edge of vertex.inEdges) {
                if (Math.abs(edge.source.layerIndex - edge.target.layerIndex) > 1) {
                    splitEdge(graph, edge);
                }
            }
        }
    }
}

function getNonVirtualSource(vertex: Vertex) {
    if (vertex.isVirtual) {
        return getNonVirtualSource(vertex.inEdges[0].source);
    }
    return vertex;
}

function getNonVirtualTarget(vertex: Vertex) {
    if (vertex.isVirtual) {
        return getNonVirtualTarget(vertex.outEdges[0].target);
    }
    return vertex;
}

function removeVirtualVertices(graph: Graph) {
    for (let iL = 0; iL < graph.layers.length; iL++) {
        for (const vertex of graph.layers[iL]) {
            if (vertex.isVirtual) {
                const oldInEdge: Edge = vertex.inEdges[0];
                const oldOutEdge: Edge = vertex.outEdges[0];
                oldInEdge.target = oldOutEdge.target;
                oldOutEdge.target.inEdges = oldOutEdge.target.inEdges.filter(e => e === oldOutEdge);
                oldOutEdge.target.inEdges.push(oldInEdge);
            }
        }
        graph.layers[iL] = graph.layers[iL].filter(vertex => !vertex.isVirtual);
    }
}

function splitEdge(graph: Graph, edge: Edge) {
    const layerSpan = edge.source.layerIndex - edge.target.layerIndex;
    const maxVertexIndex: number = graph.vertices.length - 1;
    const layers: Vertex[][] = graph.layers;
    const target: Vertex = edge.target;
    const source: Vertex = edge.source;
    const sourceIsCompressed: boolean = source instanceof CompressedVertexGroup;
    const targetIsCompressed: boolean = target instanceof CompressedVertexGroup;
    // add new virtual nodes
    for (let i = 1; i < layerSpan; ++i) {
        const iL: number = edge.source.layerIndex - i;
        const vertex: Vertex = new Vertex();
        if (sourceIsCompressed) {
            vertex.size = source.size / layerSpan * i;
        } else if (targetIsCompressed) {
            vertex.size = target.size / layerSpan * (layerSpan - i);
        }
        graph.insertVertex(vertex);
        vertex.isVirtual = true;

        layers[iL].push(vertex);
        vertex.indexInLayer = layers[iL].length - 1;
        vertex.layerIndex = iL;
    }

    // ToDO: Improve
    const edgeOutIndex: number = edge.source.outEdges.findIndex(e => e.target.index === edge.target.index);
    const edgeInIndex: number = edge.target.inEdges.findIndex(e => e.source.index === edge.source.index);
    const newSpanStartEdge: Edge = new Edge(graph.vertices[edge.source.index], graph.vertices[maxVertexIndex + 1], true);
    newSpanStartEdge.weight = edge.weight;
    graph.vertices[edge.source.index].outEdges[edgeOutIndex] = newSpanStartEdge; // replacing old edge
    graph.vertices[maxVertexIndex + 1].inEdges = [newSpanStartEdge];
    const newSpanEndEdge: Edge = new Edge(graph.vertices[maxVertexIndex + layerSpan - 1], graph.vertices[edge.target.index], true);
    newSpanEndEdge.weight = edge.weight;
    graph.vertices[edge.target.index].inEdges[edgeInIndex] = newSpanEndEdge;
    graph.vertices[maxVertexIndex + layerSpan - 1].outEdges = [newSpanEndEdge];

    for (let i = 1; i < layerSpan - 1; ++i) {
        const newSpanInBetweenEdge: Edge = new Edge(graph.vertices[maxVertexIndex + i], graph.vertices[maxVertexIndex + i + 1], true);
        newSpanInBetweenEdge.weight = edge.weight;
        graph.vertices[maxVertexIndex + i].outEdges = [newSpanInBetweenEdge];
        graph.vertices[maxVertexIndex + i + 1].inEdges = [newSpanInBetweenEdge];
    }
}
