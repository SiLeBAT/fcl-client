import * as _ from 'lodash';
import {VisioBox, VisioConnector, VisioPort, Position} from './datatypes';
import {getDifference} from '@app/tracing/util/geometry-utils';
// import { RequiredPick } from '@app/tracing/util/utility-types';

// export type VisioBoxWithPosition = RequiredPick<VisioBox, 'position'>;
export type VisioBoxWithPosition = VisioBox;

export class LotBoxSorter {
  private portToConnectedPositionsMap: Map<string, Position[]>;
  private portToPositionMap: Map<string, Position>;

  constructor(
    portToBoxMap: Map<VisioPort, VisioBoxWithPosition>,
    connectors: VisioConnector[]
  ) {
    const portToConnectedPortsMap =
      this.createPortToConnectedPortsMap(connectors);
    this.portToPositionMap = this.createPortToPositionMap(portToBoxMap);
    this.portToConnectedPositionsMap = this.createPortToConnectedPositionsMap(
      portToConnectedPortsMap
    );
  }

  sortLotBoxes(lotBoxes: VisioBox[]) {
    const boxes = this.getInitialSorting(lotBoxes);
    this.applySorting(boxes, lotBoxes);
  }

  private applySorting(orderedBoxes: VisioBox[], boxesToSort: VisioBox[]) {
    for (let i = 0; i < orderedBoxes.length; i++) {
      boxesToSort[i] = orderedBoxes[i];
    }
  }

  private createPortToConnectedPositionsMap(
    portToConnectedPortsMap: Map<string, string[]>
  ): Map<string, Position[]> {
    const portToConnectedPositionsMap: Map<string, Position[]> = new Map();
    portToConnectedPortsMap.forEach((toPorts, fromPort) => {
      portToConnectedPositionsMap.set(
        fromPort,
        toPorts.map(p => this.portToPositionMap.get(p)!)
      );
    });
    return portToConnectedPositionsMap;
  }

  private getInitialSorting(boxes: VisioBoxWithPosition[]): VisioBox[] {
    const refPosition: Position = this.getReferencePosition(boxes);
    const weightedBoxes = boxes.map(b => ({
      weight: this.getWeight(b, refPosition),
      box: b,
    }));
    weightedBoxes.sort((wB1, wB2) => wB1.weight - wB2.weight);

    return weightedBoxes.map(wb => wb.box);
  }

  private getReferencePosition(boxes: VisioBox[]): Position {
    const minX = Math.min(...boxes.map(b => b.position!.x));
    const maxX = Math.max(...boxes.map(b => b.position!.x + b.size.width));
    return {
      x: minX + (maxX - minX) / 2,
      y: boxes[0].position!.y + boxes[0].size.height,
    };
  }

  private getWeight(box: VisioBox, fromPortPosition: Position): number {
    const positions = this.portToConnectedPositionsMap.get(box.ports[0].id)!;
    const x = positions.map(p =>
      this.getNormalizedDeltaX(getDifference(p, fromPortPosition))
    );
    return _.mean(x);
  }

  private getNormalizedDeltaX(position: Position): number {
    const distance = Math.sqrt(
      position.x * position.x + position.y * position.y
    );
    if (distance === 0) {
      return 0;
    } else {
      return position.x / distance;
    }
  }

  private createPortToConnectedPortsMap(
    connectors: VisioConnector[]
  ): Map<string, string[]> {
    const portId2ConnectedPortIds = new Map<string, string[]>();
    connectors.forEach(connector => {
      if (!portId2ConnectedPortIds.has(connector.fromPort)) {
        portId2ConnectedPortIds.set(connector.fromPort, []);
      }
      if (!portId2ConnectedPortIds.has(connector.toPort)) {
        portId2ConnectedPortIds.set(connector.toPort, []);
      }
      portId2ConnectedPortIds.get(connector.fromPort)!.push(connector.toPort);
      portId2ConnectedPortIds.get(connector.toPort)!.push(connector.fromPort);
    });
    return portId2ConnectedPortIds;
  }

  private createPortToPositionMap(
    portToBoxMap: Map<VisioPort, VisioBoxWithPosition>
  ): Map<string, Position> {
    const result: Map<string, Position> = new Map();

    portToBoxMap.forEach((box, port) => {
      result.set(port.id, {
        x: box.position!.x + port.normalizedPosition.x * box.size.width,
        y: box.position!.y + port.normalizedPosition.y * box.size.height,
      });
    });

    return result;
  }
}
