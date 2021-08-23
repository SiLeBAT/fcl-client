import { Size, PositionMap, Position, Layout } from '../../data.model';
import { GraphData } from './cy-graph';
import { BoundingBox, CyNodeData } from '../graph.model';
import { BoundaryRect, createRect, getRectUnion, isRectWithinRect } from '@app/tracing/util/geometry-utils';

export interface Margin {
    left: number;
    right: number;
    top: number;
    bottom: number;
}

export function getActivePositions(graphData: GraphData): Position[] {
    const posMap = graphData.nodePositions;
    return graphData.nodeData.map(n => posMap[n.id]);
}

export function getAvailableSpace(htmlElement: HTMLElement): Size {
    const rect = htmlElement.getBoundingClientRect();
    return {
        width: rect.width,
        height: rect.height
    };
}

export function getZoomedNodePositions(nodeData: CyNodeData[], posMap: PositionMap, zoom: number): PositionMap {
    const zoomedPosMap: PositionMap = { ...posMap };
    nodeData.forEach(n => {
        const oldPos = posMap[n.id];
        if (oldPos !== undefined) {
            zoomedPosMap[n.id] = {
                x: oldPos.x * zoom,
                y: oldPos.y * zoom
            };
        }
    });
    return zoomedPosMap;
}

export function getZoomedGraphData(graphData: GraphData): GraphData {
    const layout = graphData.layout || {
        zoom: 1,
        pan: { x: 0.0, y: 0.0 }
    };
    return {
        ...graphData,
        nodePositions: graphData.nodePositions !== undefined ?
            getZoomedNodePositions(graphData.nodeData, graphData.nodePositions, layout.zoom) :
            undefined,
        ghostData: graphData.ghostData === null ?
            null :
            {
                ...graphData.ghostData,
                posMap: getZoomedNodePositions(graphData.ghostData.nodeData, graphData.ghostData.posMap, layout.zoom)
            },
        layout: {
            zoom: 1,
            pan: layout.pan
        }
    };
}

export function createMargin(margin: number): Margin {
    return {
        left: margin,
        right: margin,
        bottom: margin,
        top: margin
    };
}

function getMaxMargin(margin1: Margin, margin2: Margin): Margin {
    return {
        left: Math.max(margin1.left, margin2.left),
        right: Math.max(margin1.right, margin2.right),
        top: Math.max(margin1.top, margin2.top),
        bottom: Math.max(margin1.bottom, margin2.bottom)
    };
}

function getSizeWithoutMargin(size: Size, margin: Margin): Size {
    return {
        width: size.width - margin.left - margin.right,
        height: size.height - margin.top - margin.bottom
    };
}

function fitsRectInSize(rect: BoundaryRect, size: Size): boolean {
    return rect.width < rect.width &&
        rect.height < rect.height;
}

export function vpToStr(viewPort: Layout): string {
    return 'z: ' + nToStr(viewPort.zoom) +
        ', px: ' + nToStr(viewPort.pan.x) +
        ', py: ' + nToStr(viewPort.pan.y);
}

export function sizeToStr(size: Size): string {
    return 'w: ' + nToStr(size.width) +
        ', h: ' + nToStr(size.height);
}

export function rectToStr(rect: BoundaryRect): string {
    return 'l: ' + nToStr(rect.left) +
        ', t: ' + nToStr(rect.top) +
        ', r: ' + nToStr(rect.right) +
        ', b: ' + nToStr(rect.bottom) +
        ', w: ' + nToStr(rect.width) +
        ', h: ' + nToStr(rect.height);
}

export function marginToStr(margin: Margin): string {
    return 'l: ' + nToStr(margin.left) +
        ', t: ' + nToStr(margin.top) +
        ', r: ' + nToStr(margin.right) +
        ', b: ' + nToStr(margin.bottom) ;
}

export function bbToRect(bb: BoundingBox): BoundaryRect {
    return {
        left: bb.x1,
        right: bb.x2,
        top: bb.y1,
        bottom: bb.y2,
        width: bb.w,
        height: bb.h
    };
}

function nToStr(x: number, mL = 3): string {
    if (x === 0) {
        return '0';
    } else {
        return x < 0 ? '-' + pNToStr(-x, mL) : pNToStr(x, mL);
    }
}

function pNToStr(x: number, mL = 3): string {
    const xLog = Math.log10(x);
    const rxLog = Math.floor(xLog);
    const normFactor = Math.pow(10, mL - rxLog - 1);
    const normx = Math.round(x * normFactor) / normFactor;
    return '' + normx;
}

export function getExtendedTargetIncludingViewPort(
    refViewPort: Layout,
    availableSpace: Size,
    refMargin: Margin,
    modelTargetRect: BoundaryRect,
    targetMargin: Margin,
    minZoom: number
): Layout {
    let rendTargetRect = getRenderedRect(modelTargetRect, targetMargin, refViewPort);
    let rendRefRect = createRect(0, 0, availableSpace.width, availableSpace.height);

    if (isRectWithinRect(rendTargetRect, rendRefRect)) {
        return refViewPort;
    } else {
        // determine zoom
        const spaceWoMargin = getSizeWithoutMargin(availableSpace, getMaxMargin(refMargin, targetMargin));
        const modelRefRect = getModelRect(rendRefRect, refMargin, refViewPort);
        const modelUnionRect = getRectUnion(modelRefRect, modelTargetRect);
        minZoom = Math.max(minZoom, getMinSizeRatio(spaceWoMargin, modelUnionRect));

        let rendUnionRect = getRectUnion(rendRefRect, rendTargetRect);
        const zoomFactor = getMinSizeRatio(availableSpace, rendUnionRect);
        let maxZoom = refViewPort.zoom * zoomFactor;
        const viewport = { ...refViewPort, pan: { ...refViewPort.pan } };

        const zoomTolerance = 1 / (Math.max(availableSpace.width, availableSpace.height));
        do {
            viewport.zoom = (maxZoom + minZoom) / 2;
            rendTargetRect = getRenderedRect(modelTargetRect, targetMargin, viewport);
            rendRefRect = getRenderedRect(modelRefRect, refMargin, viewport);
            rendUnionRect = getRectUnion(rendRefRect, rendTargetRect);
            if (fitsRectInSize(rendUnionRect, availableSpace)) {
                minZoom = viewport.zoom;
            } else {
                maxZoom = viewport.zoom;
            }
        } while (maxZoom - minZoom > zoomTolerance);

        // determine pan
        viewport.zoom = minZoom;
        if (rendUnionRect.width <= availableSpace.width) {
            // xdim of union fits into viewport
            viewport.pan.x += -rendUnionRect.left + (availableSpace.width - rendUnionRect.width) / 2;
        } else if (availableSpace.width <= rendTargetRect.width) {
            // SubGraph is wider than viewport (minZoom constraint)
            viewport.pan.x -= rendTargetRect.left + (rendTargetRect.width - availableSpace.width) / 2;
        } else {
            // rendered union is wider than viewport
            viewport.pan.x = -Math.max(0, modelTargetRect.right * viewport.zoom + targetMargin.right - availableSpace.width) +
                + Math.max(0, -(modelTargetRect.left * viewport.zoom - targetMargin.left));
        }
        if (rendUnionRect.height <= availableSpace.height) {
            // ydim of union fits into viewport
            viewport.pan.y += -rendUnionRect.top + (availableSpace.height - rendUnionRect.height) / 2;
        } else if (availableSpace.height <= rendTargetRect.height) {
            // SubGraph is heigher than viewport (minZoom constraint)
            viewport.pan.y -= rendTargetRect.top + (rendTargetRect.height - availableSpace.height) / 2;
        } else {
            // rendered union is wider than viewport
            viewport.pan.y = -Math.max(0, modelTargetRect.bottom * viewport.zoom + targetMargin.bottom - availableSpace.height) +
                + Math.max(0, -(modelTargetRect.top * viewport.zoom - targetMargin.top));
        }
        return viewport;
    }
}

function getMinSizeRatio(size1: Size, size2: Size): number {
    return Math.min(
        size1.width / size2.width,
        size1.height / size2.height
    );
}

export function getRenderedRect(modelRect: BoundaryRect, modelMargin: Margin, viewport: Layout): BoundaryRect {
    const left = modelRect.left * viewport.zoom + viewport.pan.x - modelMargin.left;
    const right = modelRect.right * viewport.zoom + viewport.pan.x + modelMargin.right;
    const top = modelRect.top * viewport.zoom + viewport.pan.y - modelMargin.top;
    const bottom = modelRect.bottom * viewport.zoom + viewport.pan.y + modelMargin.bottom;
    return {
        left: left,
        right: right,
        top: top,
        bottom: bottom,
        width: right - left,
        height: bottom - top
    };
}

function getModelRect(rendRect: BoundaryRect, modelMargin: Margin, viewport: Layout): BoundaryRect {
    return createRect(
        (rendRect.left - viewport.pan.x + modelMargin.left) / viewport.zoom,
        (rendRect.top - viewport.pan.y + modelMargin.top) / viewport.zoom,
        (rendRect.right - viewport.pan.x - modelMargin.right) / viewport.zoom,
        (rendRect.bottom - viewport.pan.y - modelMargin.bottom) / viewport.zoom
    );
}
