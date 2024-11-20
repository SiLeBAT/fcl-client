import { Graph, Vertex } from "./data-structures";
import {
    compressSimpleSources,
    decompressSimpleSources,
    compressSimpleTargets,
    decompressSimpleTargets,
} from "./component-compressor";
import {
    LayeredComponent,
    splitUnconnectedComponents,
    mergeUnconnectedComponents,
} from "./component-seperator";
import { sortVerticesInLayers as sortVerticesToOptimality } from "./vertex-sorter-milp";
import { sortVertices as sortVerticesWithHeuristic } from "./vertex-sorter";
import { positionVertices } from "./vertex-positioner-lp";
import { createVirtualVertices, getRequiredLayerSpace } from "./shared";
import * as _ from "lodash";
import { Size } from "@app/tracing/data.model";
import { concat } from "@app/tracing/util/non-ui-utils";

const INTER_COMPONENT_SPACE_FACTOR = 2;

export function sortAndPosition(
    graph: Graph,
    vertexDistance: number,
    timeLimit: number,
    availableSpace?: Size,
) {
    if (timeLimit === undefined) {
        timeLimit = Number.POSITIVE_INFINITY;
    } else {
        timeLimit = Math.max(timeLimit, 1000);
    }
    const startTime = new Date().getTime();
    const layeredComponents: LayeredComponent[] = splitUnconnectedComponents(
        graph.layers,
    );
    for (const layeredComponent of layeredComponents) {
        graph.layers = layeredComponent.layers;
        compressSimpleSources(graph, vertexDistance);
        compressSimpleTargets(graph, vertexDistance);

        createVirtualVertices(graph);

        sortVertices(graph, timeLimit - (new Date().getTime() - startTime));
    }

    const availableSpacesForComponents = availableSpace
        ? getAvailableSpacesForComponents(
              graph,
              layeredComponents,
              availableSpace,
              vertexDistance,
          )
        : undefined;

    layeredComponents.forEach((layeredComponent, i) => {
        graph.layers = layeredComponent.layers;

        positionVerticesInLayers(
            graph,
            vertexDistance,
            availableSpacesForComponents
                ? availableSpacesForComponents[i]
                : undefined,
        );

        decompressSimpleSources(graph, vertexDistance);
        decompressSimpleTargets(graph, vertexDistance);
    });

    graph.layers = mergeUnconnectedComponents(
        layeredComponents,
        vertexDistance * INTER_COMPONENT_SPACE_FACTOR,
    );
}

// debug method
function printPositions(layers: Vertex[][]): void {
    const positions = concat(
        ...layers.map((layer) =>
            layer
                .filter((v) => !v.isVirtual)
                .map((v) => "p" + v.index + "_" + v.name + ": " + v.y),
        ),
    );
    // eslint-disable-next-line no-console
    console.log("uncompressed positions:");
    // eslint-disable-next-line no-console
    console.log(positions.join("\n"));
}

function positionVerticesInLayers(
    graph: Graph,
    vertexDistance: number,
    maxLayerLength?: number,
) {
    positionVertices(graph.layers, vertexDistance, maxLayerLength);
}

function sortVertices(graph: Graph, timeLimit: number) {
    const maxLayerSize: number = Math.max(
        ...graph.layers.map((layer) => layer.length),
    );
    const graphSize: number = _.sum(graph.layers.map((layer) => layer.length));
    const splitCount: number = _.sum(
        graph.layers.map((layer) =>
            _.sum(
                layer.map(
                    (vertex) =>
                        (vertex.inEdges.length >= 2 ? 1 : 0) +
                        (vertex.outEdges.length >= 2 ? 1 : 0),
                ),
            ),
        ),
    );

    if (maxLayerSize > 8 || graphSize > 30 || splitCount > 12) {
        sortVerticesWithHeuristic(graph, timeLimit);
    } else {
        sortVerticesToOptimality(graph, timeLimit);
    }
}

function getAvailableSpacesForComponents(
    graph: Graph,
    layeredComponents: LayeredComponent[],
    availableSpace: Size,
    vertexDistance: number,
): number[] {
    const requiredComponentSpaces = layeredComponents.map((comp) =>
        getReqiredComponentSpace(comp.layers, vertexDistance),
    );
    const totalSpaceRequirement =
        _.sum(requiredComponentSpaces) +
        vertexDistance *
            INTER_COMPONENT_SPACE_FACTOR *
            (layeredComponents.length - 1);
    const graphScale = availableSpace.height / totalSpaceRequirement;

    return requiredComponentSpaces.map((s) => s * graphScale);
}

function getReqiredComponentSpace(
    layers: Vertex[][],
    vertexDistance: number,
): number {
    const requiredLayerSpaces: number[] = layers.map((layer) =>
        getRequiredLayerSpace(layer, vertexDistance),
    );
    return Math.max(...requiredLayerSpaces);
}
