import {Vertex, Graph, Edge, CompressedVertexGroup, CompressionType} from './data_structures';
import {compressSimpleSources, decompressSimpleSources, compressSimpleTargets} from './component_compressor';
import {LayeredComponent, splitUnconnectedComponents, mergeUnconnectedComponents} from './component_seperator';
import {sortVerticesInLayers} from './vertex_sorter_milp';
import * as _ from 'lodash';

function sortAndPosition(graph: Graph, width: number, height: number, vertexDistance: number) {
  const layeredComponents: LayeredComponent[] = splitUnconnectedComponents(graph.layers);
  for(const layeredComponent of layeredComponents) {
    if(Math.max(...layeredComponent.layers.map(layer=>layer.length))>1) {
      graph.layers = layeredComponent.layers;
      compressSimpleSources(graph, vertexDistance);
      compressSimpleTargets(graph, vertexDistance);
      sortVerticesInLayers(graph);
      positionVerticesInLayers(graph);
      decompressSimpleSources(graph, vertexDistance);
      decompressSimpleTargets(graph, vertexDistance);
    }
  }
}