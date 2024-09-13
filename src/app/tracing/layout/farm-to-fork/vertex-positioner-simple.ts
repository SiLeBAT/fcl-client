import { Vertex } from "./data-structures";

class VertexPositionerSimple {
    positionVertices(layers: Vertex[][], vertexDistance: number) {
        const nLayers: number = layers.length;
        const layerDistance: number = 1;
        const bottomMargin = vertexDistance;
        const rightMargin = layerDistance / 2;

        let x: number = rightMargin;
        for (const layer of layers) {
            let y: number = bottomMargin;
            for (const vertex of layer) {
                vertex.y = y;
                vertex.x = x;
                y += vertexDistance;
            }
            x -= layerDistance;
        }
    }
}

export function positionVertices(layers: Vertex[][], vertexDistance: number) {
    const vertexPositioner: VertexPositionerSimple =
        new VertexPositionerSimple();
    vertexPositioner.positionVertices(layers, vertexDistance);
}
