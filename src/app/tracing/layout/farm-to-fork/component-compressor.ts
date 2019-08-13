import { Vertex, Graph, Edge, CompressedVertexGroup, CompressionType } from './farm-to-fork.model';
import * as _ from 'lodash';

export function compressSimpleSources(graph: Graph, vertexDistance: number) {

    for (const layer of graph.layers) {
        const targetToSourceMap: Map<number, Vertex[]> = new Map();

        for (const source of layer.filter(
            v => v.inEdges.length === 0 && v.outEdges.length === 1
        )) {
            if (!targetToSourceMap.has(source.outEdges[0].target.index)) {
                targetToSourceMap.set(source.outEdges[0].target.index, [source]);
            } else { targetToSourceMap.get(source.outEdges[0].target.index).push(source); }
        }

        targetToSourceMap.forEach((sources: Vertex[], targetIndex: number) => {
            if (sources.length >= 2) {
                // the target is connected to at least 2 sources
                const target: Vertex = sources[0].outEdges[0].target;
                const vertexGroup: CompressedVertexGroup = new CompressedVertexGroup(
                    sources,
                    CompressionType.SOURCE_COMPRESSION
                );
                graph.insertVertex(vertexGroup);
                vertexGroup.size = -vertexDistance;
                const newEdge: Edge = new Edge(vertexGroup, target, false);
                vertexGroup.outEdges.push(newEdge);

                for (const source of sources) {
                    vertexGroup.size += vertexDistance + source.size;
                    const oldEdge: Edge = source.outEdges[0];
                    newEdge.weight += oldEdge.weight;
                    target.inEdges = target.inEdges.filter(e => e !== oldEdge);
                }
                const newLayer: Vertex[] = layer.filter(v => sources.indexOf(v) < 0);
                vertexGroup.indexInLayer = newLayer.length;
                vertexGroup.layerIndex = sources[0].layerIndex;
                newLayer.push(vertexGroup);
                graph.layers[sources[0].layerIndex] = newLayer;
                target.inEdges.push(newEdge);
            }
        });
    }
}

export function compressSimpleTargets(graph: Graph, vertexDistance: number) {

    for (const layer of graph.layers) {
        const sourceToTargetMap: Map<number, Vertex[]> = new Map();

        for (const target of layer.filter(
            v => v.outEdges.length === 0 && v.inEdges.length === 1
        )) {
            if (!sourceToTargetMap.has(target.inEdges[0].source.index)) {
                sourceToTargetMap.set(target.inEdges[0].source.index, [target]);
            } else { sourceToTargetMap.get(target.inEdges[0].source.index).push(target); }
        }
        sourceToTargetMap.forEach((targets: Vertex[], sourceIndex: number) => {
            if (targets.length >= 2) {
                const source: Vertex = targets[0].inEdges[0].source;
                const vertexGroup: CompressedVertexGroup = new CompressedVertexGroup(
                    targets,
                    CompressionType.TARGET_COMPRESSION
                );
                graph.insertVertex(vertexGroup);
                vertexGroup.size = -vertexDistance;
                const newEdge: Edge = new Edge(source, vertexGroup, false);
                vertexGroup.inEdges.push(newEdge);

                for (const target of targets) {
                    vertexGroup.size += vertexDistance + target.size;
                    const oldEdge: Edge = target.inEdges[0];
                    newEdge.weight += oldEdge.weight;
                    source.outEdges = source.outEdges.filter(e => e !== oldEdge);
                }
                const newLayer: Vertex[] = layer.filter(v => targets.indexOf(v) < 0);
                vertexGroup.indexInLayer = newLayer.length;
                vertexGroup.layerIndex = targets[0].layerIndex;
                newLayer.push(vertexGroup);
                graph.layers[targets[0].layerIndex] = newLayer;
                source.outEdges.push(newEdge);
            }
        });
    }
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

                let y: number = vertex.y - vertex.size / 2;

                // set position of sources and link to target
                for (const source of vertexGroup.compressedVertices) {
                    source.y = y + source.size / 2;
                    y += source.size + vertexDistance;
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

                let y: number = vertex.y - vertex.size / 2;

                // set position of targets and link to source
                for (const target of vertexGroup.compressedVertices) {
                    target.y = y + target.size / 2;
                    y += target.size + vertexDistance;
                    source.outEdges.push(target.inEdges[0]);
                }
            }
        }
    }
}
