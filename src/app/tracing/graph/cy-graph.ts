import { GraphServiceData, PositionMap, CyNodeData, CyEdgeData, Cy } from './graph.model';
import { Layout, Position } from '../data.model';
import { ElementRef } from '@angular/core';

interface StyleInfo {
    minNodeSize: number;
    minEdgeWidth: number;
    fontSize: number;
}

interface LayoutGenerator {

}

export enum GraphEventType {
    LAYOUT_IN_PROGRESS,
    LAYOUT_CHANGE,
    PAN_CHANGE,
    SELECTION_CHANGE,
    CONTEXT_MENU_REQUEST
}

interface GraphEventListeners {
    LAYOUT_IN_PROGRESS?: () => void;
    LAYOUT_CHANGE?: () => void;
    PAN_CHANGE?: () => void;
    SELECTION_CHANGE?: () => void;
    CONTEXT_MENU_REQUEST?: () => void;
}

export class CyGraph {

    private cy: Cy;

    set container(value: ElementRef) {}

    set zoom(value: number) {}

    get zoom(): number {
        return this.cy ? this.cy.zoom() : undefined;
    }

    get pan(): Position {
        return this.cy ? this.cy.pan() : undefined;
    }

    init(graphData: GraphServiceData, styleInfo: StyleInfo, positionMap: PositionMap, layout?: Layout): void;
    init(graphData: GraphServiceData, styleInfo: StyleInfo, layoutGenerator: LayoutGenerator): void;

    init(graphData: GraphServiceData, styleInfo: StyleInfo, posMapOrLayoutGen: PositionMap | LayoutGenerator, layout?: Layout): void {}

    runLayout(layoutGenerator: LayoutGenerator, nodeIds: string[]): void {}

    zoomTo(zoom: number, position: Position): void {}

    zoomIn(): void {}

    zoomOut(): void {}

    resetZoom(): void {}

    destroy(): void {}

    registerListener<GE extends keyof GraphEventListeners>(event: GE, listener: GraphEventListeners[GE]): void {}

    unregisterListener<GE extends keyof GraphEventListeners>(event: GE, listener: GraphEventListeners[GE]): void {}

    hoverEdges(edgeIds: string): void {}

    showGhostElements(nodeData: CyNodeData[], edgeData: CyEdgeData[]): void {}

    updateStyle(styleInfo: StyleInfo): void {}

    updateSelection(): void {}

    updateSize(): void {}
}
