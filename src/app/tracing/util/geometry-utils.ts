export interface Point {
    x: number;
    y: number;
}

export interface BoundaryRect {
    left: number;
    top: number;
    bottom: number;
    right: number;
    width: number;
    height: number;
}

export function getEnclosingRectFromPoints(points: Point[]): BoundaryRect {
    let xMin = Number.POSITIVE_INFINITY;
    let xMax = Number.NEGATIVE_INFINITY;
    let yMin = Number.POSITIVE_INFINITY;
    let yMax = Number.NEGATIVE_INFINITY;
    for (const point of points) {
        xMin = Math.min(xMin, point.x);
        xMax = Math.max(xMax, point.x);
        yMin = Math.min(yMin, point.y);
        yMax = Math.max(yMax, point.y);
    }
    return {
        left: xMin,
        right: xMax,
        top: yMin,
        bottom: yMax,
        width: xMax - xMin,
        height: yMax - yMin
    };
}

export function getNearestPointOnRect(point: Point, rect: BoundaryRect): Point {
    if (point.x <= rect.left) {
        return { x: rect.left, y: Math.min(rect.bottom, Math.max(rect.top, point.y)) };
    } else if (point.x >= rect.right) {
        return { x: rect.right, y: Math.min(rect.bottom, Math.max(rect.top, point.y)) };
    } else if (point.y <= rect.top) {
        return { x: point.x, y: rect.top };
    } else if (point.y >= rect.bottom) {
        return { x: point.x, y: rect.bottom };
    } else {
        // point is within rect
        const dLeft = point.x - rect.left;
        const dTop = point.y - rect.top;
        const dRight = rect.right - point.x;
        const dBottom = rect.bottom - point.y;
        const dMin = Math.min(dLeft, dTop, dRight, dBottom);
        if (dMin === dLeft) {
            return { x: rect.left, y: point.y };
        } else if (dMin === dTop) {
            return { x: point.x, y: rect.top };
        } else if (dMin === dRight) {
            return { x: rect.right, y: point.y };
        } else {
            return { x: point.x, y: rect.bottom };
        }
    }
}

export function getCenterFromPoints(points: Point[]): Point {
    if (points.length > 0) {
        let xSum = 0;
        let ySum = 0;

        for (const point of points) {
            xSum += point.x;
            ySum += point.y;
        }

        return {
            x: xSum / points.length,
            y: ySum / points.length
        };
    } else {
        return { x: 0, y: 0 };
    }
}

export function addPoints(point1: Point, point2: Point): Point {
    return {
        x: point1.x + point2.x,
        y: point1.y + point2.y
    };
}

export function getDifference(point1: Point, point2: Point): Point {
    return {
        x: point1.x - point2.x,
        y: point1.y - point2.y
    };
}
