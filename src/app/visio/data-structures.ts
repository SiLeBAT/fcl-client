import * as _ from 'lodash';

export interface Vertex {
  index: number;
  inEdges: Edge<Vertex>[];
  outEdges: Edge<Vertex>[];
}

export interface Edge<V extends Vertex> {
  source: V;
  target: V;
  weight: number;
}

export function invertEdge<V extends Vertex, E extends Edge<V>>(edgesToInvert: E[]) {
  for (const edge of edgesToInvert) {
    let index: number = edge.source.outEdges.indexOf(edge);
    if (index >= 0) { edge.source.outEdges = edge.source.outEdges.splice(index, 1); }
    index = edge.target.inEdges.indexOf(edge);

    const vertex: V = edge.source;
    edge.source = edge.target;
    edge.target = vertex;

    edge.source.outEdges.push(edge);
    edge.target.inEdges.push(edge);
  }
}

export interface Graph<V extends Vertex, E extends Edge<V> {
  vertices: V[];
}

export class SimpleVertex<T> implements Vertex {
  index: number;
  object: T;
  inEdges: Edge<SimpleVertex<T>>[] = [];
  outEdges: Edge<SimpleVertex<T>>[] = [];
}

export class SimpleEdge<V extends SimpleVertex<any>> implements Edge<V> {
  weight = 1;
  constructor(public source: V, public target: V) {}
}

export class SimpleGraph<T> implements Graph<SimpleVertex<T>, Edge<SimpleVertex<T>>> {
  vertices: SimpleVertex<T>[] = [];
  private keyToVertex: Map<T, SimpleVertex<T>> = new Map();

  insertVertex(object: T) {
    const vertex: SimpleVertex<T> = new SimpleVertex();
    vertex.index = this.vertices.length;
    vertex.object = object;
    this.vertices.push(vertex);
    this.keyToVertex.set(object, vertex);
  }

  insertEdge(sourceObject: T, targetObject: T) {
    const sourceVertex: SimpleVertex<T> = this.keyToVertex.get(sourceObject);
    const targetVertex: SimpleVertex<T> = this.keyToVertex.get(targetObject);
    const edge = new SimpleEdge(sourceVertex, targetVertex);
    sourceVertex.outEdges.push(edge);
    targetVertex.inEdges.push(edge);
  }
}


