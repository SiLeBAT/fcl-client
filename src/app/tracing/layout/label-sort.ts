import { Position } from "../data.model";
import { Cy, CyNode } from "../graph/graph.model";
import { isArrayNotEmpty } from "../util/non-ui-utils";
import { PCA } from "ml-pca";

export function LabelSortLayout(options) {
    this.options = options;
}

interface Vector {
    x: number;
    y: number;
}

const MIN_EXPLAINED_VARIANCE = 0.6;
const MIN_ABS_VERTICAL_SWITCH_SLOPE = 100;
const MAX_ABS_HORIZONTAL_SWITCH_SLOPE = 1 / 100;
const DIAGONAL_ABS_SLOPE = 1;

interface LineSegment {
    start: Position;
    end: Position;
}

interface Line {
    support: Vector;
    direction: Vector;
}

function getLineByPCA(xArray: number[], yArray: number[]): Line {
    const matrix: number[][] = xArray.map((x, i) => [x, yArray[i]]);

    const pca = new PCA(matrix);

    const component0 = pca.getEigenvectors().getColumn(0);
    const explainedVariance = pca.getExplainedVariance();

    const center: Position = {
        x: getMean(xArray),
        y: getMean(yArray),
    };

    if (
        isNaN(explainedVariance[0]) ||
        explainedVariance[0] < MIN_EXPLAINED_VARIANCE
    ) {
        // indifferent fallback to vertical line
        return {
            direction: { x: 0, y: -1 },
            support: center,
        };
    }
    return {
        direction: { x: component0[0], y: component0[1] },
        support: center,
    };
}

function getVectorFromAToB(a: Position, b: Position): Vector {
    return { x: b.x - a.x, y: b.y - a.y };
}

function getScalarProduct(vectorA: Vector, vectorB?: Vector): number {
    if (vectorB === undefined) {
        return getScalarProduct(vectorA, vectorA);
    }
    return vectorA.x * vectorB.x + vectorA.y * vectorB.y;
}

function getProjectedPositions(positions: Position[], line: Line): Position[] {
    const scalarL = getScalarProduct(line.direction);

    // Handle case where line dir has zero length
    if (scalarL === 0) {
        // this is only a safety guard since components of the pca have usually length 1
        return positions.map((p) => line.support); // Projection is just support vector of line
    }

    return positions.map((p) => {
        // Vector CP (from line support (equals center of points) to point P)
        const vectorCP = getVectorFromAToB(line.support, p);

        // 2. Calculate dot products
        // Dot product of CP and LineDir
        const scalarPCL = getScalarProduct(vectorCP, line.direction);

        // 3. Calculate the projection factor (scalar)
        const scalar = scalarPCL / scalarL;

        // 4. Calculate the projected point
        return {
            x: line.support.x + scalar * line.direction.x,
            y: line.support.y + scalar * line.direction.y,
        };
    });
}

function getLineSlope(line: Line): number {
    return line.direction.y / line.direction.x;
}

function getLineSegment(positions: [Position, ...Position[]]): LineSegment {
    const xArray = positions.map((p) => p.x);
    const yArray = positions.map((p) => p.y);
    if (
        xArray.every((x) => x === xArray[0]) &&
        yArray.every((y) => y === yArray[0])
    ) {
        // All nodes have the same position
        return {
            start: { ...positions[0] },
            end: { ...positions[0] },
        };
    }

    const line = getLineByPCA(xArray, yArray);
    const slope = getLineSlope(line);

    if (isSlopeQuasiVertical(slope)) {
        const newX = getMean(xArray);
        return {
            start: { x: newX, y: Math.min(...yArray) },
            end: { x: newX, y: Math.max(...yArray) },
        };
    }

    if (isSlopeQuasiHorizontal(slope)) {
        const newY = getMean(yArray);
        return {
            start: { x: Math.min(...xArray), y: newY },
            end: { x: Math.max(...xArray), y: newY },
        };
    }

    const projectedPositions = getProjectedPositions(positions, line);
    let startPos = projectedPositions[0];
    let endPos = startPos;

    if (Math.abs(slope) >= DIAGONAL_ABS_SLOPE) {
        startPos = projectedPositions.reduce(
            (pV, cV) => (pV.y <= cV.y ? pV : cV),
            startPos,
        );
        endPos = projectedPositions.reduce(
            (pV, cV) => (pV.y >= cV.y ? pV : cV),
            endPos,
        );
    } else {
        startPos = projectedPositions.reduce(
            (pV, cV) => (pV.x <= cV.x ? pV : cV),
            startPos,
        );
        endPos = projectedPositions.reduce(
            (pV, cV) => (pV.x >= cV.x ? pV : cV),
            endPos,
        );
    }
    return {
        start: startPos,
        end: endPos,
    };
}

function isSlopeQuasiVertical(slope: number): boolean {
    return isNaN(slope) || Math.abs(slope) > MIN_ABS_VERTICAL_SWITCH_SLOPE;
}

function isSlopeQuasiHorizontal(slope: number): boolean {
    return Math.abs(slope) < MAX_ABS_HORIZONTAL_SWITCH_SLOPE;
}

function getMean(array: number[]): number {
    return array.reduce((pV, cV) => pV + cV, 0) / array.length;
}

function getLinedUpPositions(
    nodes: CyNode[],
    lineSegment: LineSegment,
): Map<string, Position> {
    const nodeIdToPositionMap = new Map<string, Position>();
    const deltaX =
        (lineSegment.end.x - lineSegment.start.x) / (nodes.length - 1);
    const deltaY =
        (lineSegment.end.y - lineSegment.start.y) / (nodes.length - 1);
    nodes.forEach((n, i) => {
        nodeIdToPositionMap.set(n.id(), {
            x: lineSegment.start.x + deltaX * i,
            y: lineSegment.start.y + deltaY * i,
        });
    });
    return nodeIdToPositionMap;
}

class LabelSortLayoutClass {
    private static DEFAULTS = {
        fit: true,
    };

    private layout: any;
    private options: any;

    constructor(layout: any) {
        this.layout = layout;
        this.options = {};

        for (const key of Object.keys(layout.options)) {
            this.options[key] = layout.options[key];
        }

        for (const key of Object.keys(LabelSortLayoutClass.DEFAULTS)) {
            if (!Object.prototype.hasOwnProperty.call(this.options, key)) {
                this.options[key] = LabelSortLayoutClass.DEFAULTS[key];
            }
        }
    }

    run() {
        const cy = this.options.cy as Cy;
        const elementIds = new Set<string>();

        this.options.eles.each((e) => elementIds.add(e.id()));

        let selectedNodes = cy
            .nodes()
            .filter((n) => elementIds.has(n.id()))
            .map((n) => n);
        const positions = selectedNodes.map((n) => ({
            x: n.position().x,
            y: n.position().y,
        }));

        if (isArrayNotEmpty(positions)) {
            const lineSegment = getLineSegment(positions);
            selectedNodes = selectedNodes
                .map((n) => ({
                    n: n,
                    label: (n.data().label ?? "").toLocaleUpperCase(),
                })) // use preprocessed label for each node
                .sort((a, b) => a.label.localeCompare(b.label))
                .map((x) => x.n);

            const nodeIdToPositionMap = getLinedUpPositions(
                selectedNodes,
                lineSegment,
            );

            cy.nodes().layoutPositions(
                this.layout,
                this.options,
                (node) => nodeIdToPositionMap.get(node.id()) ?? node.position(),
            );
        }

        if (this.options.fit) {
            cy.fit();
        }
    }
}

LabelSortLayout.prototype.run = function () {
    new LabelSortLayoutClass(this).run();
};
