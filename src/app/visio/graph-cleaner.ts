import * as _ from 'lodash';
import {Graph, Vertex, Edge, WildCard} from './data-structures';

export function aggregateEdgesOfVertexPairs<T, V extends Vertex<T>>(graph: Graph<V, Edge<V>>) {
  _aggregateEdgesOfVertexPairs(graph);
}

export function removeSelfLoops<T, V extends Vertex<T>>(graph: Graph<V, Edge<V>>) {
  _removeSelfLoops(graph);
}

function _aggregateEdgesOfVertexPairs<T extends WildCard, V extends Vertex<T>, E extends Edge<V>>(graph: Graph<V, E>) {
  for (const vertex of graph.vertices) {
    vertex.inEdges = [];
    const targets: V[] = vertex.outEdges.map(e => e.target);
    const uniqueTargets: V[] = _.uniqWith(targets, (a, b) => a === b);
    const newOutEdges: E[] = [];

    for (const target of uniqueTargets) {
      const edgeIndex: number = targets.indexOf(target);
      const edge: E = vertex.outEdges[edgeIndex];
      for (let i: number = targets.length - 1; i > edgeIndex; i--) { edge.weight += vertex.outEdges[i].weight; }
      newOutEdges.push(edge);
    }
    vertex.outEdges = newOutEdges;
    for (const edge of vertex.outEdges) { edge.target.inEdges.push(edge); }
  }
}

function _removeSelfLoops<V extends Vertex, E extends Edge<V>>(graph: Graph<V, Edge<V>>) {
  for (const vertex of graph.vertices) {
    vertex.inEdges = vertex.inEdges.filter(edge => edge.source !== vertex);
    vertex.outEdges = vertex.outEdges.filter(edge => edge.target !== vertex);
  }
}



