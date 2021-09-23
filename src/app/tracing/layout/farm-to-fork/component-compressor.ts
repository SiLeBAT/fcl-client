import { Vertex, Graph, Edge, CompressedVertexGroup, CompressionType, VertexIndex } from './data-structures';
import * as _ from 'lodash';
import { getMinVertexPairSpecificDistance } from './shared';

export function compressSimpleSources(graph: Graph, vertexDistance: number) {

    for (let layerIndex = 0; layerIndex < graph.layers.length; layerIndex++) {
        let layer = graph.layers[layerIndex];
        const targetToSourcesMap = getTargetToSimpleSourcesMap(layer);

        targetToSourcesMap.forEach((sources: Vertex[]) => {
            if (sources.length >= 2) {
                // the target is connected to at least 2 sources
                const leftSource = sources[0];
                const rightSource = sources[sources.length - 1];
                const target: Vertex = leftSource.outEdges[0].target;
                const vertexGroup: CompressedVertexGroup = new CompressedVertexGroup(
                    sources,
                    CompressionType.SOURCE_COMPRESSION
                );
                graph.insertVertex(vertexGroup);
                vertexGroup.outerSize = 0;
                const newEdge: Edge = new Edge(vertexGroup, target, false);
                vertexGroup.outEdges.push(newEdge);

                sources.forEach((source, memberIndex) => {

                    if (memberIndex > 0) {
                        const vertexPairDistance = getMinVertexPairSpecificDistance(sources[memberIndex - 1], source, vertexDistance);
                        vertexGroup.outerSize += vertexPairDistance;
                    }
                    vertexGroup.outerSize += source.outerSize;
                    const oldEdge: Edge = source.outEdges[0];
                    newEdge.weight += oldEdge.weight;
                    target.inEdges = target.inEdges.filter(e => e !== oldEdge);
                });

                vertexGroup.bottomPadding = leftSource.bottomPadding;
                vertexGroup.topPadding = rightSource.topPadding;
                vertexGroup.innerSize = vertexGroup.outerSize - vertexGroup.topPadding - vertexGroup.bottomPadding;

                const newLayer: Vertex[] = _.difference(layer, sources);

                vertexGroup.indexInLayer = newLayer.length;
                vertexGroup.layerIndex = layerIndex;
                newLayer.push(vertexGroup);
                graph.layers[layerIndex] = newLayer;
                layer = newLayer;
                target.inEdges.push(newEdge);
            }
        });
    }
}

export function compressSimpleTargets(graph: Graph, vertexDistance: number) {
    for (let layerIndex = 0; layerIndex < graph.layers.length; layerIndex++) {

        let layer = graph.layers[layerIndex];
        const sourceToTargetsMap = getSourceToSimpleTargetsMap(layer);

        sourceToTargetsMap.forEach((targets: Vertex[]) => {
            if (targets.length >= 2) {

                const leftTarget = targets[0];
                const rightTarget = targets[targets.length - 1];

                const source: Vertex = leftTarget.inEdges[0].source;
                const vertexGroup: CompressedVertexGroup = new CompressedVertexGroup(
                    targets,
                    CompressionType.TARGET_COMPRESSION
                );
                graph.insertVertex(vertexGroup);
                vertexGroup.outerSize = 0;
                const newEdge: Edge = new Edge(source, vertexGroup, false);
                vertexGroup.inEdges.push(newEdge);

                targets.forEach((target, memberIndex) => {
                    if (memberIndex > 0) {
                        const vertexPairDistance = getMinVertexPairSpecificDistance(targets[memberIndex - 1], target, vertexDistance);
                        vertexGroup.outerSize += vertexPairDistance;
                    }
                    vertexGroup.outerSize += target.outerSize;
                    const oldEdge: Edge = target.inEdges[0];
                    newEdge.weight += oldEdge.weight;
                    source.outEdges = source.outEdges.filter(e => e !== oldEdge);
                });

                vertexGroup.bottomPadding = leftTarget.bottomPadding;
                vertexGroup.topPadding = rightTarget.topPadding;
                vertexGroup.innerSize = vertexGroup.outerSize - vertexGroup.bottomPadding - vertexGroup.topPadding;

                const newLayer: Vertex[] = _.difference(layer, targets);

                vertexGroup.indexInLayer = newLayer.length;
                vertexGroup.layerIndex = layerIndex;
                newLayer.push(vertexGroup);
                graph.layers[layerIndex] = newLayer;
                layer = newLayer;
                source.outEdges.push(newEdge);
            }
        });
    }
}

function getSourceToSimpleTargetsMap(layer: Vertex[]): Map<VertexIndex, Vertex[]> {
    const sourceToTargetsMap: Map<number, Vertex[]> = new Map();
    const simpleTargets = layer.filter(v => isSimpleTarget(v));
    for (const target of simpleTargets) {
        const sourceIndex = target.inEdges[0].source.index;
        if (!sourceToTargetsMap.has(sourceIndex)) {
            sourceToTargetsMap.set(sourceIndex, [target]);
        } else {
            const sourceTargets = sourceToTargetsMap.get(sourceIndex);
            sourceTargets.push(target);
        }
    }
    return sourceToTargetsMap;
}

function getTargetToSimpleSourcesMap(layer: Vertex[]): Map<VertexIndex, Vertex[]> {
    const targetToSourcesMap: Map<number, Vertex[]> = new Map();
    const simpleSources = layer.filter(v => isSimpleSource(v));
    for (const source of simpleSources) {
        const targetIndex = source.outEdges[0].target.index;
        if (!targetToSourcesMap.has(targetIndex)) {
            targetToSourcesMap.set(targetIndex, [source]);
        } else {
            const targetSources = targetToSourcesMap.get(targetIndex);
            targetSources.push(source);
        }
    }
    return targetToSourcesMap;
}

function isSimpleTarget(vertex: Vertex): boolean {
    return vertex.outEdges.length === 0 && vertex.inEdges.length === 1;
}

function isSimpleSource(vertex: Vertex): boolean {
    return vertex.inEdges.length === 0 && vertex.outEdges.length === 1;
}

function insertVertices(layer: Vertex[], index: number, vertices: Vertex[]) {
    const delta: number = vertices.length - 1;
    for (let i: number = layer.length - 1; i > index; i--) {
        layer[i].indexInLayer = i + delta;
        layer[i + delta] = layer[i];
    }
    for (let i: number = 0; i <= delta; i++) {
        layer[index + i] = vertices[i];
        layer[index + i].indexInLayer = index + i;
    }
}

export function decompressSimpleSources(graph: Graph, vertexDistance: number) {

    for (const layer of graph.layers) {
        for (const vertex of layer.filter(v => v instanceof CompressedVertexGroup)) {

            const vertexGroup: CompressedVertexGroup = vertex as CompressedVertexGroup;
            if (vertexGroup.compressionType === CompressionType.SOURCE_COMPRESSION) {
                const target: Vertex = vertexGroup.outEdges[0].target;
                // remove link to compressed vertex
                target.inEdges = target.inEdges.filter(e => e !== vertexGroup.outEdges[0]);

                // remove compressed vertex from and add contained vertices to layer
                insertVertices(
                    layer,
                    vertexGroup.indexInLayer,
                    vertexGroup.compressedVertices
                );

                let y: number = vertexGroup.y - vertexGroup.innerSize / 2 * vertexGroup.innerScale;

                // set position of sources and link to target
                for (const source of vertexGroup.compressedVertices) {

                    if (source !== vertexGroup.compressedVertices[0]) {
                        y += (source.topPadding + source.innerSize / 2) * vertexGroup.innerScale;
                    }
                    source.y = y;
                    y += (source.innerSize / 2 + source.bottomPadding + vertexDistance) * vertexGroup.innerScale;

                    target.inEdges.push(source.outEdges[0]);
                }
            }
        }
    }
}

export function decompressSimpleTargets(graph: Graph, vertexDistance: number) {
    for (const layer of graph.layers) {
        for (const vertex of layer.filter(
      v => v instanceof CompressedVertexGroup
    )) {
            const vertexGroup: CompressedVertexGroup = vertex as CompressedVertexGroup;
            if (vertexGroup.compressionType === CompressionType.TARGET_COMPRESSION) {
                const source: Vertex = vertexGroup.inEdges[0].source;
                // remove link to compressed vertex
                source.outEdges = source.outEdges.filter(e => e !== vertexGroup.inEdges[0]);

                // remove compressed vertex from and add contained vertices to layer
                insertVertices(
                    layer,
                    vertexGroup.indexInLayer,
                    vertexGroup.compressedVertices
                );

                let y = vertex.y - vertex.innerSize / 2 * vertexGroup.innerScale;

                // set position of targets and link to source
                for (const target of vertexGroup.compressedVertices) {

                    if (target !== vertexGroup.compressedVertices[0]) {
                        y += (target.topPadding + target.innerSize / 2) * vertexGroup.innerScale ;
                    }
                    target.y = y;
                    y += (target.innerSize / 2 + target.bottomPadding + vertexDistance) * vertexGroup.innerScale;

                    source.outEdges.push(target.inEdges[0]);
                }
            }
        }
    }
}
