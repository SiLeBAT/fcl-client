export function getCyCanvasParent(
    cyContainer: HTMLElement,
): HTMLElement | undefined {
    const parent = cyContainer.children.item(0);
    if (parent && parent instanceof HTMLElement) {
        return parent;
    }
    return undefined;
}

export function getCyEventLayer(
    cyContainer: HTMLElement,
): HTMLCanvasElement | undefined {
    const parent = getCyCanvasParent(cyContainer);
    if (parent) {
        const eventLayer = parent.children.item(0);
        if (eventLayer && eventLayer instanceof HTMLCanvasElement) {
            return eventLayer;
        }
    }
    return undefined;
}

export function getCyNodeLayer(
    cyContainer: HTMLElement,
): HTMLCanvasElement | undefined {
    const parent = getCyCanvasParent(cyContainer);
    if (parent) {
        const nodeLayer = parent.children.item(2);
        if (nodeLayer && nodeLayer instanceof HTMLCanvasElement) {
            return nodeLayer;
        }
    }
    return undefined;
}
