import {Vertex, Graph} from './data_structures';

class CompressedComponent extends Vertex {
  compressedVertices: Vertex[];
}

function compressSimpleConnectedComponents(graph: Graph) {

} 
function compressSimpleSources(graph: Graph) {

}
function compressSimpleTargets(graph: Graph) {
  //const vertices: Vertex[] = Array.from(...graph.layers);
  //vertices.
}

function decompressSimpleConnectedComponents(graph: Graph) {

}

function decompressSimpleSources(graph: Graph) {

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