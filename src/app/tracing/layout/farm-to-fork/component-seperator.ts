import { Vertex } from './farm-to-fork.model';
import * as _ from 'lodash';

export interface LayeredComponent {
    layerIndices: number[];
    layers: Vertex[][];
}

function traverseComponent(
  vertex: Vertex,
  marked: boolean[],
  members: Vertex[]
) {

    if (!marked[vertex.index]) {
        marked[vertex.index] = true;
        members.push(vertex);
        for (const edge of vertex.inEdges) {
            traverseComponent(edge.source, marked, members);
        }
        for (const edge of vertex.outEdges) {
            traverseComponent(edge.target, marked, members);
        }
    }
}

export function splitUnconnectedComponents(
  layers: Vertex[][]
): LayeredComponent[] {

    const result: LayeredComponent[] = [];
    const marked: boolean[] = [];
    const maxLayerSize: number = Math.max(...layers.map(layer => layer.length));
    for (const layer of layers) {
        for (const vertex of layer) {
            marked[vertex.index] = false;
        }
    }
    for (const layer of layers) {
        for (const vertex of layer) {
            if (!marked[vertex.index]) {
                const componentMembers: Vertex[] = [];

                traverseComponent(vertex, marked, componentMembers);

                const layerIndices: number[] = _.uniq(componentMembers.map(v => v.layerIndex));
                layerIndices.sort((a: number, b: number) => a < b ? -1 : (b < a ? 1 : 0));

                const layeredComponent: LayeredComponent = {
                    layerIndices: layerIndices,
                    layers: []
                };

                const oldIndexToNewIndexMap: number[] = [];
                for (let i: number = layerIndices.length - 1; i >= 0; i--) {
                    layeredComponent.layers[i] = [];
                    oldIndexToNewIndexMap[layerIndices[i]] = i;
                }

                for (const memberVertex of componentMembers) {
                    layeredComponent.layers[oldIndexToNewIndexMap[memberVertex.layerIndex]].push(memberVertex);
                }

                result.push(layeredComponent);
            }

            for (const layeredComponent of result) {
                for (
                    let iLayer: number = layeredComponent.layers.length - 1;
                    iLayer >= 0;
                    iLayer--
                ) {
                    const componentLayer: Vertex[] = layeredComponent.layers[iLayer];
                    for (
                        let iVertex: number = componentLayer.length - 1;
                        iVertex >= 0;
                        iVertex--
                    ) {
                        componentLayer[iVertex].layerIndex = iLayer;
                        componentLayer[iVertex].indexInLayer = iVertex;
                    }
                }
            }
        }
    }
    return result;
}

export function mergeUnconnectedComponents(
  layeredComponents: LayeredComponent[],
  componentDistance: number
): Vertex[][] {

    const result: Vertex[][] = [];
    const nLayers: number = Math.max(
      ...layeredComponents.map(
        layeredComponent =>
          layeredComponent.layerIndices[
            layeredComponent.layerIndices.length - 1
          ]
      )
    ) + 1;

    for (let iLayer: number = nLayers - 1; iLayer >= 0; iLayer--) {
        result[iLayer] = [];
    }

    let offset: number = 0;

    for (const layeredComponent of layeredComponents) {
        let maxComponentSize: number = 0;
        for (
            let iLayer: number = layeredComponent.layers.length - 1;
            iLayer >= 0;
            iLayer--
        ) {
            const layer: Vertex[] = result[layeredComponent.layerIndices[iLayer]];

            for (const vertex of layeredComponent.layers[iLayer]) {
                layer.push(vertex);
                vertex.y += offset;
            }
            maxComponentSize = Math.max(
                maxComponentSize,
                layer[layer.length - 1].y - offset + layer[layer.length - 1].size / 2
            );
        }
        offset += componentDistance + maxComponentSize;
    }

    for (let iLayer: number = nLayers - 1; iLayer >= 0; iLayer--) {
        const layer: Vertex[] = result[iLayer];
        for (let iVertex: number = layer.length - 1; iVertex >= 0; iVertex--) {
            layer[iVertex].layerIndex = iLayer;
            layer[iVertex].indexInLayer = iVertex;
        }
    }
    return result;
}
