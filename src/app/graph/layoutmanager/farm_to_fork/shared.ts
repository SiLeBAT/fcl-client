import * as _ from 'lodash';
import {Graph, Vertex, Edge, CompressedVertexGroup} from './data_structures';

export function scaleToSize(graph: Graph, width: number, height: number) {
  const maxSize: number = Math.max(...graph.layers.map(layer=>(layer.length>0?layer[layer.length-1].y + layer[layer.length-1].size/2:0)));
  if(maxSize>height) {
    width = maxSize/height*width;
  } else {
    const offset: number = (height-maxSize)/2;
    for(const layer of graph.layers) for(const vertex of layer) vertex.y+= offset;
  }
  const layerDistance: number = width / (graph.layers.length-1+1);
  const offset: number = layerDistance/2;

  for(let iLayer: number = graph.layers.length-1; iLayer>=0; iLayer--) {
    const x: number = width - offset - iLayer*layerDistance;
    for(const vertex of graph.layers[iLayer]) vertex.x = x;
  }
}

export function createVirtualVertices(graph: Graph) {
  for(let layer of graph.layers) for(let vertex of layer) for(let edge of vertex.inEdges) if(Math.abs(edge.source.layerIndex-edge.target.layerIndex)>1) splitEdge(graph, edge);
}

function splitEdge(graph: Graph, edge: Edge) {
  const layerSpan = edge.source.layerIndex-edge.target.layerIndex;
  const maxVertexIndex: number = graph.vertices.length-1;
  const layers: Vertex[][] = graph.layers;
  const target: Vertex = edge.target;
  const source: Vertex = edge.source;
  const sourceIsCompressed: boolean = source instanceof CompressedVertexGroup;
  const targetIsCompressed: boolean = target instanceof CompressedVertexGroup;
  // add new virtual nodes
  for(let i: number = 1; i<layerSpan; ++i) {
    let iL: number = edge.source.layerIndex - i;
    let vertex: Vertex = new Vertex();
    if(sourceIsCompressed) vertex.size = source.size/layerSpan*i;
    else if(targetIsCompressed) vertex.size = target.size/layerSpan*(layerSpan-i);
    graph.insertVertex(vertex);
    vertex.isVirtual = true;
    //graph.vertices.push(new Vertex()); 
    //vertexRank[++maxVertexIndex] = iL; // 
    layers[iL].push(vertex);
    vertex.indexInLayer = layers[iL].length-1;
    vertex.layerIndex = iL;
  }
  
  // ToDO: Improve
  let edgeOutIndex: number = edge.source.outEdges.findIndex(e => {return e.target.index===edge.target.index});
  let edgeInIndex: number = edge.target.inEdges.findIndex(e => {return e.source.index===edge.source.index});
  const newSpanStartEdge: Edge = new Edge(graph.vertices[edge.source.index], graph.vertices[maxVertexIndex + 1], true);
  newSpanStartEdge.weight = edge.weight;
  graph.vertices[edge.source.index].outEdges[edgeOutIndex] = newSpanStartEdge; // replacing old edge
  graph.vertices[maxVertexIndex+1].inEdges = [newSpanStartEdge];
  const newSpanEndEdge: Edge = new Edge(graph.vertices[maxVertexIndex + layerSpan - 1], graph.vertices[edge.target.index], true);
  newSpanEndEdge.weight = edge.weight;
  graph.vertices[edge.target.index].inEdges[edgeInIndex] = newSpanEndEdge;
  graph.vertices[maxVertexIndex+layerSpan-1].outEdges = [newSpanEndEdge];
  
  for(let i: number = 1; i<layerSpan-1; ++i) { 
    const newSpanInBetweenEdge: Edge = new Edge(graph.vertices[maxVertexIndex+i], graph.vertices[maxVertexIndex+i+1], true);
    newSpanInBetweenEdge.weight = edge.weight;
    graph.vertices[maxVertexIndex+i].outEdges = [newSpanInBetweenEdge];
    graph.vertices[maxVertexIndex+i+1].inEdges = [newSpanInBetweenEdge];
  }
  
  // ToDo: 
  // set size to virtual nodes
}