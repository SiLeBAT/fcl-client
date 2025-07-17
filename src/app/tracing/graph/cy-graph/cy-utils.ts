import { CANVAS_LAYER_INDICES } from "./cy.constants";

type CyCanvasLayers = Record<
    "nodeLayer" | "edgeLayer" | "eventLayer",
    HTMLCanvasElement
>;

function getCyCanvasLayer(
    cyContainer: HTMLElement,
    index: number,
): HTMLCanvasElement {
    const element = cyContainer.children.item(0)?.children?.item(index);
    if (element && element instanceof HTMLCanvasElement) {
        return element;
    }
    throw new Error(`Could not find canvas layer with index ${index}!`);
}

export function getCyEventLayer(cyContainer: HTMLElement): HTMLCanvasElement {
    return getCyCanvasLayer(cyContainer, CANVAS_LAYER_INDICES.event);
}

export function getCyCanvasLayers(cyContainer: HTMLElement): CyCanvasLayers {
    return {
        nodeLayer: getCyCanvasLayer(cyContainer, CANVAS_LAYER_INDICES.node),
        edgeLayer: getCyCanvasLayer(cyContainer, CANVAS_LAYER_INDICES.edge),
        eventLayer: getCyEventLayer(cyContainer),
    };
}
