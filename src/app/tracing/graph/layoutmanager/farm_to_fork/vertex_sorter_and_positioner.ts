import {
  Vertex,
  Graph,
  Edge,
  CompressedVertexGroup,
  CompressionType
} from './data_structures';
import {
  compressSimpleSources,
  decompressSimpleSources,
  compressSimpleTargets,
  decompressSimpleTargets
} from './component_compressor';
import {
  LayeredComponent,
  splitUnconnectedComponents,
  mergeUnconnectedComponents
} from './component_seperator';
import { sortVerticesInLayers as sortVerticesToOptimality } from './vertex_sorter_milp';
import { sortVertices as sortVerticesWithHeuristic } from './vertex_sorter';
import { positionVertices } from './vertex_positioner_lp';
import { createVirtualVertices } from './shared';
import * as _ from 'lodash';

export function sortAndPosition(graph: Graph, vertexDistance: number) {
  // const layers: Vertex[][] = graph.layers;
    const layeredComponents: LayeredComponent[] = splitUnconnectedComponents(
    graph.layers
  );
    for (const layeredComponent of layeredComponents) {
    // if(Math.max(...layeredComponent.layers.map(layer=>layer.length))>1) {
        graph.layers = layeredComponent.layers;
        compressSimpleSources(graph, vertexDistance);
        compressSimpleTargets(graph, vertexDistance);
        createVirtualVertices(graph);
    // sortVerticesInLayers(graph);

        sortVertices(graph);
        positionVerticesInLayers(graph, vertexDistance);
        decompressSimpleSources(graph, vertexDistance);
        decompressSimpleTargets(graph, vertexDistance);
    // }
    }
  // for(let i: number = layers.length-1; i>=0; i--) layers[i] = [];
    graph.layers = mergeUnconnectedComponents(
    layeredComponents,
    vertexDistance * 2
  );
}

function positionVerticesInLayers(graph: Graph, vertexDistance: number) {
    positionVertices(graph.layers, vertexDistance);
}

function sortVertices(graph: Graph) {
    const maxLayerSize: number = Math.max(
    ...graph.layers.map(layer => layer.length)
  );
    const graphSize: number = _.sum(graph.layers.map(layer => layer.length));
    const splitCount: number = _.sum(
    graph.layers.map(layer =>
      _.sum(
        layer.map(
          vertex =>
            (vertex.inEdges.length >= 2 ? 1 : 0) +
            (vertex.outEdges.length >= 2 ? 1 : 0)
        )
      )
    )
  );
  // if(maxLayerSize>6 || graphSize>30 || splitCount>10) sortVerticesWithHeuristic(graph);
    if (maxLayerSize > 8 || graphSize > 30 || splitCount > 12) {
        sortVerticesWithHeuristic(graph);
    } else { sortVerticesToOptimality(graph); }
}
