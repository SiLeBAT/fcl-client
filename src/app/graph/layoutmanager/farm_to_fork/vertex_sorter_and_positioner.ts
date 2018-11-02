import {Vertex, Graph, Edge, CompressedVertexGroup, CompressionType} from './data_structures';
import {compressSimpleSources, decompressSimpleSources, compressSimpleTargets, decompressSimpleTargets} from './component_compressor';
import {LayeredComponent, splitUnconnectedComponents, mergeUnconnectedComponents} from './component_seperator';
import {sortVerticesInLayers} from './vertex_sorter_milp';
import {positionVertices} from './vertex_positioner_lp';
import * as _ from 'lodash';

export function sortAndPosition(graph: Graph, vertexDistance: number) {
  //const layers: Vertex[][] = graph.layers;
  const layeredComponents: LayeredComponent[] = splitUnconnectedComponents(graph.layers);
  for(const layeredComponent of layeredComponents) {
    if(Math.max(...layeredComponent.layers.map(layer=>layer.length))>1) {
      graph.layers = layeredComponent.layers;
      compressSimpleSources(graph, vertexDistance);
      compressSimpleTargets(graph, vertexDistance);
      sortVerticesInLayers(graph);
      positionVerticesInLayers(graph, vertexDistance);
      decompressSimpleSources(graph, vertexDistance);
      decompressSimpleTargets(graph, vertexDistance);
    }
  }
  //for(let i: number = layers.length-1; i>=0; i--) layers[i] = [];
  graph.layers = mergeUnconnectedComponents(layeredComponents, vertexDistance*2);
}

function positionVerticesInLayers(graph: Graph, vertexDistance: number) {
  positionVertices(graph.layers, vertexDistance);
}



