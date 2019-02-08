import * as _ from 'lodash';
import { VisioBox, VisioConnector, VisioPort, Position } from './datatypes';
import { Utils } from 'app/util/utils';

interface WeightedBox {
    weight: number;
    box: VisioBox;
}

export class LotBoxSorter {
    private portToConnectedPositionsMap: Map<string, Position[]>;
    private portToPositionMap: Map<string, Position>;

    constructor(portToBoxMap: Map<VisioPort, VisioBox>, connectors: VisioConnector[]) {
        const portToConnectedPortsMap = this.createPortToConnectedPortsMap(connectors);
        this.portToPositionMap = this.createPortToPositionMap(portToBoxMap);
        this.portToConnectedPositionsMap = this.createPortToConnectedPositionsMap(portToConnectedPortsMap);
    }

    private getMinPosition(lotBoxes: VisioBox[]): Position {
        return {
            x: Math.min(...lotBoxes.map(b => b.position.x)),
            y: Math.min(...lotBoxes.map(b => b.position.y))
        };
    }

    sortLotBoxes(lotBoxes: VisioBox[]) {
        const boxes = this.getInitialSorting(lotBoxes);
        // this.improveSorting(boxes);
        this.applySorting(boxes, lotBoxes);
    }

    private applySorting(orderedBoxes: VisioBox[], boxesToSort: VisioBox[]) {
        for (let i = 0; i < orderedBoxes.length; i++) {
            boxesToSort[i] = orderedBoxes[i];
        }
    }

    private createPortToConnectedPositionsMap(portToConnectedPortsMap: Map<string, string[]>): Map<string, Position[]> {
        const portToConnectedPositionsMap: Map<string, Position[]> = new Map();
        portToConnectedPortsMap.forEach((toPorts, fromPort) => {
            const fromPortPosition = this.portToPositionMap.get(fromPort);
            portToConnectedPositionsMap.set(fromPort, toPorts.map(p => this.portToPositionMap.get(p)));
        });
        return portToConnectedPositionsMap;
    }

    /*
    private improveSorting(boxes: VisioBox[]) {
        const minPos = this.getMinPosition(boxes);
        for (let i = 1; i < boxes.length; i++) {
            const crossCount1 = this.getCrossingCount(boxes)
        }
    }*/

    private getInitialSorting(boxes: VisioBox[]): VisioBox[] {
        const weightedBoxes = boxes.map(
            b => ({
                weight: this.getWeight(b, this.portToPositionMap.get(b.ports[0].id)),
                box: b
            })
        );
        weightedBoxes.sort((wB1, wB2) => wB1.weight - wB2.weight);
        return weightedBoxes.map(wb => wb.box);
    }

    private getWeight(box: VisioBox, fromPortPosition: Position): number {
        const positions = this.portToConnectedPositionsMap.get(box.ports[0].id);
        const x = positions.map(p => this.getNormalizedDeltaX(Utils.difference(p, fromPortPosition)));
        return _.mean(x);
    }

    private getNormalizedDeltaX(position: Position): number {
        const distance = Math.sqrt(position.x * position.x + position.y * position.y);
        if (distance === 0) {
            return 0;
        } else {
            return position.x / distance;
        }
    }

    /*
    private areLinesCrossings(fromA: Position, toA: Position, fromB: Position, toB: Position): boolean {
        // function intersects(a,b,c,d,p,q,r,s) {
        // det = (c - a) * (s - q) - (r - p) * (d - b);
        const det = (toA.x - fromA.x) * (toB.y - fromB.y) - (toB.x - fromB.x) * (toA.y - fromA.y);
        if (det === 0) {
            return false;
        } else {
            // lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            const lambda = ((toB.y - fromB.y) * (toB.x - fromA.x) + (fromB.x - toB.x) * (toB.y - fromA.y)) / det;
            // gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            const gamma = ((fromA.y - toA.y) * (toB.x - fromA.x) + (toA.x - fromA.x) * (toB.y - fromA.y)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    }
    */

    /*
    private getCrossingCount(relPosToA: Position[], relPosToB: Position[]): number {
        let crossingCount = 0;
        for (const pA of relPosToA) {
            for (const pB of relPosToB) {
                if (pA.x < 0) {
                    if (pB.x >= 0) {
                        // ok.
                    } else {
                        const dA = pA.y / (-pA.x);
                        const dB = pB.y / (-pB.x);
                        if (dA > dB) {
                            crossingCount++;
                        } else {
                            // ok.
                        }
                    }
                } else {

                }
            }
        }
    }*/

    private createPortToConnectedPortsMap(connectors: VisioConnector[]): Map<string, string[]> {
        const result: Map<string, string[]> = new Map();
        connectors.forEach(connector => {
            if (!result.has(connector.fromPort)) {
                result.set(connector.fromPort, []);
            }
            if (!result.has(connector.toPort)) {
                result.set(connector.toPort, []);
            }
            result.get(connector.fromPort).push(connector.toPort);
            result.get(connector.toPort).push(connector.fromPort);
        });
        return result;
    }

    private createPortToPositionMap(portToBoxMap: Map<VisioPort, VisioBox>): Map<string, Position> {
        const result: Map<string, Position> = new Map();

        portToBoxMap.forEach((box, port) => {
            result.set(port.id, {
                x: box.position.x + port.normalizedPosition.x * box.size.width,
                y: box.position.y + port.normalizedPosition.y * box.size.height
            });
        });

        return result;
    }
}
