import {Vertex, Graph, Edge, CompressedVertexGroup, CompressionType} from './data_structures';
import * as _ from 'lodash';

const VERTEX_DIST: number = 1;

function compressSimpleConnectedComponents(graph: Graph) {

} 

function compressSimpleSources(graph: Graph) {
  const MIN_SOURCE_COUNT: number = 2;  
  //const sources: Vertex[] = [].concat(...graph.layers).filter(v=>v.inEdges.length==0 && v.outEdges.length==1);
  
  for(const layer of graph.layers) {
    const targetToSourceMap: Map<number, Vertex[]> = new Map();
    for(const source of layer.filter(v=>v.inEdges.length==0 && v.outEdges.length==1)) {
      if(!targetToSourceMap.has(source.outEdges[0].target.index)) targetToSourceMap.set(source.outEdges[0].target.index, [source]);
      else targetToSourceMap.get(source.outEdges[0].target.index).push(source);    
    }
    targetToSourceMap.forEach((sources: Vertex[], targetIndex: number)=> {
      if(sources.length>=MIN_SOURCE_COUNT) {
        const target: Vertex = sources[0].outEdges[0].target;
        const compressedVertex: Vertex = 
        const vertexGroup: CompressedSourceGroup = new CompressedSourceGroup();
        compressedVertex.compressedVertices = sources;
        let size: number = - this.SOURCE_DIST;
        const newEdge: Edge = new Edge(compressedVertex, target, false);
        compressedVertex.outEdges.push(newEdge);
        for(const source of sources) {
          size+= this.SOURCE_DIST + vertex.size;
          const oldEdge: Edge =  source.outEdges[0];
          newEdge.weight+= oldEdge.weight;
          target.inEdges = target.inEdges.filter(e=>e!=oldEdge);
        }
        const newLayer: Vertex[] = layer.filter(v=>sources.indexOf(v)<0);
        graph.layers[sources[0].layerIndex] = newLayer;
        target.inEdges.push(newEdge);
      }
    });
  }
  

}
function compressSimpleTargets(graph: Graph) {
  //const vertices: Vertex[] = Array.from(...graph.layers);
  //vertices.
}

function decompressSimpleConnectedComponents(graph: Graph) {

}

function decompressSimpleSources(graph: Graph) {
  for(const layer of graph.layers) {
    
    for(const vertex of layer.filter(v=>v instanceof CompressedSourceGroup)) {
      let y: number = vertex.y-vertex.size/2;
      graph.
      const compressedSourceGroup: CompressedSourceGroup = vertex;
      for(const source of compressedSource.)
    }
    targetToSourceMap.forEach((sources: Vertex[], targetIndex: number)=> {
      if(sources.length>=MIN_SOURCE_COUNT) {
        const target: Vertex = sources[0].outEdges[0].target;
        const compressedVertex: CompressedSourceGroup = new CompressedSourceGroup();
        compressedVertex.compressedVertices = sources;
        let size: number = - this.SOURCE_DIST;
        const newEdge: Edge = new Edge(compressedVertex, target, false);
        compressedVertex.outEdges.push(newEdge);
        for(const source of sources) {
          size+= this.SOURCE_DIST + vertex.size;
          const oldEdge: Edge =  source.outEdges[0];
          newEdge.weight+= oldEdge.weight;
          target.inEdges = target.inEdges.filter(e=>e!=oldEdge);
        }
        const newLayer: Vertex[] = layer.filter(v=>sources.indexOf(v)<0);
        graph.layers[sources[0].layerIndex] = newLayer;
        target.inEdges.push(newEdge);
      }
    });
  }
}

function decompressSimpleTargets(graph: Graph) {

}

function compress(graph: Graph) {
  compressSimpleSources(graph);
  compressSimpleTargets(graph);
  compressSimpleConnectedComponents(graph);
}

function decompress(graph: Graph) {
  compressSimpleSources(graph);
  compressSimpleTargets(graph);
  compressSimpleConnectedComponents(graph);
}