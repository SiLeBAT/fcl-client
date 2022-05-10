import { PositionMap } from '@app/tracing/data.model';
import { BoundaryRect, createRect, doRectsIntersect, getRectIntersection, isRectWithinRect } from '@app/tracing/util/geometry-utils';

export function isPosMapEmpty(posMap: PositionMap): boolean {
    // eslint-disable-next-line guard-for-in, no-restricted-syntax
    for (const x in posMap) {
        return false;
    }
    return true;
}

export function getNonBlockedRect(container: HTMLElement, blockClass: string): BoundaryRect {
    const containerRect = container.getBoundingClientRect();
    const elements = document.getElementsByClassName(blockClass);
    let blockingRects: BoundaryRect[] = [];
    for (let i = 0; i < elements.length; i++) {
        const element = elements.item(i);
        const rect = element.getBoundingClientRect();
        if (doRectsIntersect(containerRect, rect)) {
            const intersection = getRectIntersection(containerRect, rect);
            if (intersection.width * intersection.height > 0) {
                blockingRects.push(getRectIntersection(containerRect, rect));
            }
        }
    }

    let unblockedRect = createRect(containerRect.left, containerRect.top, containerRect.right, containerRect.bottom);

    while (blockingRects.length > 0) {
        blockingRects = blockingRects.filter(br => doRectsIntersect(unblockedRect, br));
        blockingRects = blockingRects.map(br => getRectIntersection(unblockedRect, br));
        blockingRects = blockingRects.filter(br => br.width * br.height > 0);
        const blockEffects = blockingRects.map(blockingRect => {
            const remainingRect = getBiggestUnblockedEnclosedRect(unblockedRect, blockingRect);
            const area = remainingRect.width * remainingRect.height;
            return {
                blockingRect: blockingRect,
                remainingRect: remainingRect,
                remainingArea: area
            };
        });
        blockEffects.sort((br1, br2) => br2.remainingArea - br1.remainingArea);
        if (blockEffects.length > 0) {
            unblockedRect = blockEffects.pop().remainingRect;
        } else {
            break;
        }
    }
    unblockedRect = updateRect(unblockedRect, {
        left: unblockedRect.left - containerRect.left,
        right: unblockedRect.right - containerRect.left,
        top: unblockedRect.top - containerRect.top,
        bottom: unblockedRect.bottom - containerRect.top
    });
    return unblockedRect;
}

function updateRect(rect: BoundaryRect, update: Partial<BoundaryRect>): BoundaryRect {
    rect = {
        ...rect,
        ...update
    };
    rect.width = rect.right - rect.left;
    rect.height = rect.bottom - rect.top;
    return rect;
}

export function cropRect(rect: BoundaryRect, cropValue: number): BoundaryRect {
    return updateRect(rect, {
        left: rect.left + cropValue,
        right: rect.right - cropValue,
        top: rect.top + cropValue,
        bottom: rect.bottom - cropValue
    });
}

function getBiggestUnblockedEnclosedRect(rect: BoundaryRect, blockingRect: BoundaryRect): BoundaryRect | null {
    if (!doRectsIntersect(rect, blockingRect)) {
        return rect;
    } else if (isRectWithinRect(rect, blockingRect)) {
        return null;
    } else {
        const solutions: BoundaryRect[] = [];
        if (blockingRect.left > rect.left) {
            solutions.push(updateRect(rect, { right: blockingRect.left }));
        }
        if (blockingRect.right < rect.right) {
            solutions.push(updateRect(rect, { left: blockingRect.right }));
        }
        if (blockingRect.top > rect.top) {
            solutions.push(updateRect(rect, { bottom: blockingRect.top }));
        }
        if (blockingRect.bottom < rect.bottom) {
            solutions.push(updateRect(rect, { top: blockingRect.bottom }));
        }
        let maxArea = Number.NEGATIVE_INFINITY;
        let bestSolution: BoundaryRect | null = null;
        for (const solution of solutions) {
            const area = solution.width * solution.height;
            if (area > maxArea) {
                bestSolution = solution;
                maxArea = area;
            }
        }
        return bestSolution;
    }
}
