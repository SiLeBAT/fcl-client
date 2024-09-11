import {concat} from '@app/tracing/util/non-ui-utils';
import * as _ from 'lodash';
import {Graph, Vertex, Edge, CompressedVertexGroup} from './data-structures';

const ABSOLUTE_HORIZONTAL_MARGIN = 0;

export function scaleToSize(
  graph: Graph,
  width: number,
  height: number,
  vertexDistance: number
) {
  const vertices: Vertex[] = graph.vertices.filter(
    v => !v.isVirtual && !(v instanceof CompressedVertexGroup)
  );
  let maxSize: number = Math.max(
    ...vertices.map(v => v.y + v.bottomPadding * v.layerScale)
  );

  const MAX_SCALE = 2;
  const scale = Math.max(1, Math.min(MAX_SCALE, height / maxSize));
  maxSize *= scale;

  if (maxSize > height) {
    // fit width
    width = (maxSize / height) * width;
  } else {
    // vertical centering
    const voffset: number = (height - maxSize) / 2;
    for (const layer of graph.layers) {
      for (const vertex of layer) {
        vertex.y = vertex.y * scale + voffset;
      }
    }
  }

  const default_hoffset: number = ABSOLUTE_HORIZONTAL_MARGIN;
  const maxNeighbourDistance: number = getMaxNeighbourDistance(vertices);

  const layerDistance: number = Math.min(
    (width - 2 * default_hoffset) / (graph.layers.length - 1), // layerDistance based on width and layer count
    Math.max(
      vertexDistance * 5, // default layerDistance
      maxNeighbourDistance * 2 // layerDistance based on NeighbourDistance
    )
  );

  const hoffset: number =
    (width - layerDistance * (graph.layers.length - 1)) / 2;

  for (const vertex of vertices) {
    vertex.x = width - hoffset - vertex.layerIndex * layerDistance;
  }
}

function getMaxNeighbourDistance(vertices: Vertex[]): number {
  const vertexCount = vertices.length;

  const distances: number[] = _.fill(Array(vertexCount), 0);
  for (let iV = 0; iV < vertexCount; iV++) {
    const vertex = vertices[iV];

    const neighbours: Vertex[] = concat(
      vertex.inEdges.map(e => getNonVirtualSource(e.source)),
      vertex.outEdges.map(e => getNonVirtualTarget(e.target))
    ).filter(v => v.index < vertexCount);

    for (const neighbour of neighbours) {
      distances[neighbour.index] = Math.max(
        distances[neighbour.index],
        Math.abs(neighbour.y - vertex.y) /
          Math.abs(vertex.layerIndex - neighbour.layerIndex)
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
      vertex.innerSize = (source.innerSize / layerSpan) * i;
    } else if (targetIsCompressed) {
      vertex.innerSize = (target.innerSize / layerSpan) * (layerSpan - i);
    }
    vertex.topPadding = 0;
    vertex.bottomPadding = 0;
    vertex.outerSize = 0;
    graph.insertVertex(vertex);
    vertex.isVirtual = true;

    layers[iL].push(vertex);
    vertex.indexInLayer = layers[iL].length - 1;
    vertex.layerIndex = iL;
  }

  const edgeOutIndex: number = edge.source.outEdges.findIndex(
    e => e.target.index === edge.target.index
  );
  const edgeInIndex: number = edge.target.inEdges.findIndex(
    e => e.source.index === edge.source.index
  );
  const newSpanStartEdge: Edge = new Edge(
    graph.vertices[edge.source.index],
    graph.vertices[maxVertexIndex + 1],
    true
  );
  newSpanStartEdge.weight = edge.weight;
  graph.vertices[edge.source.index].outEdges[edgeOutIndex] = newSpanStartEdge; // replacing old edge
  graph.vertices[maxVertexIndex + 1].inEdges = [newSpanStartEdge];
  const newSpanEndEdge: Edge = new Edge(
    graph.vertices[maxVertexIndex + layerSpan - 1],
    graph.vertices[edge.target.index],
    true
  );
  newSpanEndEdge.weight = edge.weight;
  graph.vertices[edge.target.index].inEdges[edgeInIndex] = newSpanEndEdge;
  graph.vertices[maxVertexIndex + layerSpan - 1].outEdges = [newSpanEndEdge];

  for (let i = 1; i < layerSpan - 1; ++i) {
    const newSpanInBetweenEdge: Edge = new Edge(
      graph.vertices[maxVertexIndex + i],
      graph.vertices[maxVertexIndex + i + 1],
      true
    );
    newSpanInBetweenEdge.weight = edge.weight;
    graph.vertices[maxVertexIndex + i].outEdges = [newSpanInBetweenEdge];
    graph.vertices[maxVertexIndex + i + 1].inEdges = [newSpanInBetweenEdge];
  }
}

export function getMinVertexPairSpecificDistance(
  vertexA: Vertex,
  vertexB: Vertex,
  vertexDistance: number
): number {
  const MIN_SIBLING_DIST = vertexDistance * 1;
  const MIN_NONSIBLING_DIST = vertexDistance * 2;
  const MIN_NODE_TO_EDGE_DIST = vertexDistance * 1;
  const MIN_EDGE_TO_EDGE_DIST = 0;

  if (vertexB.isVirtual) {
    if (vertexA.isVirtual) {
      return MIN_EDGE_TO_EDGE_DIST;
    } else {
      return MIN_NODE_TO_EDGE_DIST;
    }
  } else {
    if (vertexA.isVirtual) {
      return MIN_NODE_TO_EDGE_DIST;
    } else if (shareVerticesAParent(vertexA, vertexB)) {
      return MIN_SIBLING_DIST;
    } else if (shareVerticesAChild(vertexA, vertexB)) {
      return MIN_SIBLING_DIST;
    } else {
      return MIN_NONSIBLING_DIST;
    }
  }
}

export function getMinScaledVertexPairPosDistance(
  vertexA: Vertex,
  vertexB: Vertex,
  vertexDistance: number
): number {
  const distA =
    (vertexA.innerSize / 2) * vertexA.innerScale +
    vertexA.bottomPadding * vertexA.layerScale;
  const distB =
    (vertexB.innerSize / 2) * vertexB.innerScale +
    vertexB.topPadding * vertexB.layerScale;

  const innerDist =
    getMinVertexPairSpecificDistance(vertexA, vertexB, vertexDistance) *
    vertexA.layerScale;
  return distA + innerDist + distB;
}

export function getUnscaledMinVertexPairPosDistance(
  vertexA: Vertex,
  vertexB: Vertex,
  vertexDistance: number
): number {
  const distA = vertexA.innerSize / 2 + vertexA.bottomPadding;
  const distB = vertexB.innerSize / 2 + vertexB.topPadding;

  const innerDist = getMinVertexPairSpecificDistance(
    vertexA,
    vertexB,
    vertexDistance
  );
  return distA + innerDist + distB;
}

function shareVerticesAParent(vertexA: Vertex, vertexB: Vertex): boolean {
  return (
    _.intersection(
      vertexA.inEdges.map(e => e.source.index),
      vertexB.inEdges.map(e => e.source.index)
    ).length > 0
  );
}

function shareVerticesAChild(vertexA: Vertex, vertexB: Vertex): boolean {
  return (
    _.intersection(
      vertexA.outEdges.map(e => e.target.index),
      vertexB.outEdges.map(e => e.target.index)
    ).length > 0
  );
}

export function getRequiredLayerSpace(
  layer: Vertex[],
  vertexDistance: number
): number {
  let space = 0;
  if (layer.length > 0) {
    let lastVertex: Vertex | null = null;

    for (const vertex of layer) {
      space += vertex.outerSize;
      if (lastVertex !== null) {
        getMinVertexPairSpecificDistance(lastVertex, vertex, vertexDistance);
      }
      lastVertex = vertex;
    }
  }
  return space;
}

export function getRequiredScaledLayerSpace(
  layer: Vertex[],
  vertexDistance: number
): number {
  let space = 0;
  if (layer.length > 0) {
    let lastVertex: Vertex | null = null;

    for (const vertex of layer) {
      space += (vertex.bottomPadding + vertex.topPadding) * vertex.layerScale;
      space += vertex.innerSize * vertex.innerScale;
      if (lastVertex !== null) {
        space +=
          getMinVertexPairSpecificDistance(lastVertex, vertex, vertexDistance) *
          vertex.layerScale;
      }
      lastVertex = vertex;
    }
  }
  return space;
}
