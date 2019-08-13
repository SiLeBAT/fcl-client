import { Graph } from './farm-to-fork.model';
import { compressSimpleSources, decompressSimpleSources, compressSimpleTargets, decompressSimpleTargets } from './component-compressor';
import { LayeredComponent, splitUnconnectedComponents, mergeUnconnectedComponents } from './component-seperator';
import { sortVerticesInLayers as sortVerticesToOptimality } from './vertex-sorter-milp';
import { sortVertices as sortVerticesWithHeuristic } from './vertex-sorter';
import { positionVertices } from './vertex-positioner-lp';
import { createVirtualVertices } from './shared';
import * as _ from 'lodash';

export function sortAndPosition(graph: Graph, vertexDistance: number) {

    const layeredComponents: LayeredComponent[] = splitUnconnectedComponents(graph.layers);
    for (const layeredComponent of layeredComponents) {

        graph.layers = layeredComponent.layers;
        compressSimpleSources(graph, vertexDistance);
        compressSimpleTargets(graph, vertexDistance);
        createVirtualVertices(graph);

        sortVertices(graph);
        positionVerticesInLayers(graph, vertexDistance);
        decompressSimpleSources(graph, vertexDistance);
        decompressSimpleTargets(graph, vertexDistance);
    }

    graph.layers = mergeUnconnectedComponents(layeredComponents, vertexDistance * 2);
}

function positionVerticesInLayers(graph: Graph, vertexDistance: number) {
    positionVertices(graph.layers, vertexDistance);
}

function sortVertices(graph: Graph) {
    const maxLayerSize: number = Math.max(...graph.layers.map(layer => layer.length));
    const graphSize: number = _.sum(graph.layers.map(layer => layer.length));
    const splitCount: number = _.sum(graph.layers.map(layer => _.sum(layer.map(
          vertex =>
            (vertex.inEdges.length >= 2 ? 1 : 0) +
            (vertex.outEdges.length >= 2 ? 1 : 0)
    ))));

    if (maxLayerSize > 8 || graphSize > 30 || splitCount > 12) {
        sortVerticesWithHeuristic(graph);
    } else {
        sortVerticesToOptimality(graph);
    }
}
