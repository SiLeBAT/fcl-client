import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './general-data-structures';

export function removeCycles<V extends Vertex>(graph: Graph<V, Edge<V>>) {
  _removeCycles(graph);
}

function _removeCycles<V extends Vertex>(graph: Graph<V, Edge<V>>) {
  const vertices: Vertex[] = graph.vertices;
  const vertexCount: number = vertices.length;
  const isMarked: boolean[] = _.fill(Array(vertexCount), false);
  const isStacked: boolean[] = _.fill(Array(vertexCount), false);

  for (let i = 0; i < vertexCount; i++) { dfsRemove(i, vertices, isMarked, isStacked); }
}

function dfsRemove<V extends Vertex>(index: number, vertices: V[], isMarked: boolean[], isStacked: boolean[]) {
  if (isMarked[index]) {return; }
  
  const vertex: V = vertices[index];
  isMarked[index] = true;
  isStacked[index] = true;
  const reversedOutEdges: Set<Edge<Vertex>> = new Set();
  
  for (let iE = 0; iE < vertex.outEdges.length; iE++) {
    const outEdge: Edge<Vertex> = vertex.outEdges[iE];
    if (isStacked[outEdge.target.index]) {
      // reverse edge
      reversedOutEdges.add(outEdge);
    } else if (!this.isMarked[outEdge.target.index]) {
      this.dfsRemove(outEdge.target);
    }
  }
  
  reversedOutEdges.forEach(edge => reverseEdge(edge));
  
  this.isStacked[vertex.index] = false;
}

function reverseEdge<V extends Vertex>(edge: Edge<V>) {
  // remove old links
  edge.source.outEdges = edge.source.outEdges.filter(e => e !== edge);

  edge.target.inEdges = edge.target.inEdges.filter(e => e !== edge);

  // switch source and target
  const oldSource: V = edge.source;
  edge.source = edge.target;
  edge.target = oldSource;

  // set new links
  //edge.isReversed = !edge.isReversed;
  edge.source.outEdges.push(edge);
  edge.target.inEdges.push(edge);
}