import * as _ from 'lodash';
import {Graph, Vertex, Edge, WildCard} from './general-data-structures';

// assumes a directed acyclic graph
export function assignLayers<T extends WildCard, V extends Vertex<T>>(vertices: V[]): V[][] {
  return _assignLayers(vertices);
}

function getForkVertices<T extends WildCard, V extends Vertex<T>>(vertices: V[], vertexOutEdgeCounts: number[]): V[] {
  const result: V[] = [];
  for (let i = 0, n: number = this.vertexOutEdgeCounts.length; i < n; ++i) {
    if (vertexOutEdgeCounts[i] < 1) {
      result.push(vertices[i]);
    }
  }
  return result;
}

function getIncomingEdges<T extends WildCard, V extends Vertex<T>>(vertices: V[]): Edge<V>[] {
  return [].concat(...vertices.map(v => v.inEdges));
}

function _assignLayers<T extends WildCard, V extends Vertex<T>>(vertices: V[]): V[][] {
  const vertexOutEdgeCounts: number[] = vertices.map(vertex => vertex.outEdges.length);
  
  const layers: V[][] = [];
  let sinks: V[] = getForkVertices(vertices, vertexOutEdgeCounts);
  
  while (sinks.length > 0) {
    const sinkInEdges = this.getIncomingEdges(sinks);
    for (const edge of sinkInEdges) {
      this.vertexOutEdgeCounts[edge.source.index]--;
    }
    
    layers.push(sinks);
    
    sinks = [];
    // get new sinks
    for (const edge of sinkInEdges) {
      if (this.vertexOutEdgeCounts[edge.source.index] < 1) {
        sinks.push(edge.source);
      }
    }
    
    sinks = Array.from(new Set(sinks));
  }

  return layers;
}
