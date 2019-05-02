import * as _ from 'lodash';
import { VisioReport, VisioBox, StationInformation, GraphLayer, FontMetrics,
    Size, ReportType, StationGrouper, NodeLayoutInfo, VisioConnector, VisioPort } from './datatypes';
import { Utils } from '../../util/utils';

interface BoxGroup {
    label: string;
    boxes: VisioBox[];
}
/*
interface Connection {
    connector: VisioConnector;
    fromBox: VisioBox;
    toBox: VisioBox;
}

interface StationBox extends VisioBox {
    lotBoxes: VisioBox[];
}
export class StationBoxRepositioner {
    static improvePositions(stationBoxes: StationBox[][], boxGroups: BoxGroup[], connectors: VisioConnector[]) {
        // const boxToLevelMap: Map<VisioBox, number> = new Map();
        const portToBoxMap: Map<string, VisioBox> = new Map();
        const portToLevelMap: Map<string, number> = new Map();
        stationBoxes.forEach((boxes, index) => boxes.forEach(box => this.addPortMappings(box, portToBoxMap, portToLevelMap, index)));
        const levelToConsMap: VisioConnector[][] = Utils.getMatrix(stationBoxes.length, 0, null as VisioConnector);
        // const conToMinLevel: Map<string, number> = Utils.arrayToMap(connectors, (c) => Math.min(portToLevelMap.get(c.)))
        connectors.forEach((connector, index) => levelToConsMap[this.get].push(connector);
        });
        let openCons: VisioConnector[] = levelToConsMap[0].slice();
        for (let level = 1; level < stationBoxes.length; level++) {
            openCons = openCons.filter(c => {

            });
        }
    }

    static connectorToMinLevel(connector: VisioConnector, portToLevelMap: Map<string, number>): number {
        const fromLevel = portToLevelMap.get(connector.fromPort);
        const toLevel = portToLevelMap.get(connector.toPort);
        return Math.min(fromLevel, toLevel);
    }

    static connectorToMaxLevel(connector: VisioConnector, portToLevelMap: Map<string, number>): number {
        const fromLevel = portToLevelMap.get(connector.fromPort);
        const toLevel = portToLevelMap.get(connector.toPort);
        return Math.max(fromLevel, toLevel);
    }

    static addPortMappings(box: VisioBox, portToBoxMap: Map<VisioPort, VisioBox>, portToLevelMap: Map<VisioPort, number>, level: number) {
        box.ports.forEach(p => portToBoxMap.set(p, box));
        box.elements.forEach(element => this.addPortMappings(element, portToBoxMap, portToLevelMap, level));
    }
}
*/
