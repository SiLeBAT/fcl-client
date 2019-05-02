import * as _ from 'lodash';
// import {Solver} from 'javascript-lp-solver';
import { lpSolve, LPModel, LPResult } from './../../../shared/lp_solver';
import { VisioBox, VisioConnector, VisioPort, Position } from './datatypes';
import { Utils } from '../../util/utils';

interface BoxPort {
    x: number;
}

interface Link {
    id: string;
    from: BoxPort;
    to: BoxPort;
}

interface Box {
    id: string;
    size: number;
}

interface BoxModel {
    boxes: Box[][];
    links: Link[];
    portToBoxMap: Map<BoxPort, Box>;
    boxToGroupIndexMap: Map<Box, number>;
    isGroupEqual: (a: Box, b: Box) => boolean;
}

function addBoxPorts(ports: { id: string, port: BoxPort }[], visioBox: VisioBox, unnormalizePos: (x: number) => number) {
    visioBox.ports.forEach(p =>
        ports.push({
            id: p.id,
            port: { x: unnormalizePos(p.normalizedPosition.x) }
        })
    );

    visioBox.elements.forEach(element =>
        addBoxPorts(ports, element, (x: number) => unnormalizePos(0) + element.relPosition.x + element.size.width * x)
    );
}

function createBoxPorts(stationBox: VisioBox): { id: string, port: BoxPort }[] {
    const result: { id: string, port: BoxPort }[] = [];
    addBoxPorts(result, stationBox, (x: number) => stationBox.size.width * x);
    return result;
}

function createBoxToGroupIndexMap(stationBoxToBoxMap: Map<VisioBox, Box>, groups: {label: string, boxes: VisioBox[]}[]): Map<Box, number> {
    const result: Map<Box, number> = new Map();
    groups.forEach((group, groupIndex) => {
        group.boxes.forEach(stationBox => result.set(stationBoxToBoxMap.get(stationBox), groupIndex));
    });
    return result;
}

function createLinks(idToPortMap: Map<string, BoxPort>, connectors: VisioConnector[]): Link[] {
    const result: Link[] = [];
    let id = 0;
    for (let i = 0; i < connectors.length; i++) {
        result.push({
            id: 'L' + id++,
            from: idToPortMap.get(connectors[i].fromPort),
            to: idToPortMap.get(connectors[i].toPort)
        });
    }
    return result;
}

function constructBoxModel(
    stationBoxes: VisioBox[][],
    groups: { label: string, boxes: VisioBox[] }[],
    connectors: VisioConnector[]): BoxModel {

    const idToPortMap: Map<string, BoxPort> = new Map();
    const portToBoxMap: Map<BoxPort, Box> = new Map();
    const boxes: Box[][] = [];
    const statBoxToBoxMap: Map<VisioBox, Box> = new Map();

    stationBoxes.forEach((stationBoxRow, rowIndex) => {
        const boxRow: Box[] = [];
        stationBoxRow.forEach((stationBox, boxIndex) => {
            const box: Box = {
                id: 'B' + rowIndex + '.' + boxIndex,
                size: stationBox.size.width
            };
            const boxPorts = createBoxPorts(stationBox);
            boxPorts.forEach(p => {
                idToPortMap.set(p.id, p.port);
                portToBoxMap.set(p.port, box);
            });
            statBoxToBoxMap.set(stationBox, box);
            boxRow.push(box);
        });
        boxes.push(boxRow);
    });

    const boxToGroupIndexMap = createBoxToGroupIndexMap(statBoxToBoxMap, groups);
    const isGroupEqual = (a: Box, b: Box) => boxToGroupIndexMap.get(a) === boxToGroupIndexMap.get(b);
    return {
        boxes: boxes,
        links: createLinks(idToPortMap, connectors),
        boxToGroupIndexMap: createBoxToGroupIndexMap(statBoxToBoxMap, groups),
        portToBoxMap: portToBoxMap,
        isGroupEqual: isGroupEqual
    };
}

function constructLPModel(
    boxModel: BoxModel,
    intraGroupDistance: number,
    interGroupDistance: number): LPModel {

    const lpModel = new LPModel();
    const varNameWidth = 'GW';
    addNeighbourConstraints(boxModel, lpModel, intraGroupDistance, interGroupDistance);
    addBoundaryContraints(boxModel, lpModel, varNameWidth);
    addLinkConstraints(boxModel, lpModel);
    setObjective(boxModel, lpModel, varNameWidth);

    return lpModel;
}

function setObjective(boxModel: BoxModel, lpModel: LPModel, varNameWidth: string) {
    const objective = {};
    objective[varNameWidth] = 1;

    boxModel.links.forEach(link => objective[link.id] = 1);
    lpModel.setObjective('min', objective);
}

function addNeighbourConstraints(boxModel: BoxModel, lpModel: LPModel, intraGroupDistance: number, interGroupDistance: number) {
    boxModel.boxes.forEach((boxRow, rowIndex) => {
        for (let i = 1; i < boxRow.length; i++) {
            const minDistance = boxModel.isGroupEqual(boxRow[i - 1], boxRow[i])
                ? intraGroupDistance : interGroupDistance;
            lpModel.addConstraint(
                'NC' + rowIndex + '.' + (i - 1),
                minDistance + boxRow[i - 1].size,
                undefined,
                {
                    [boxRow[i].id]: 1,
                    [boxRow[i - 1].id]: -1
                }
            );
        }
    });
}

function addBoundaryContraints(boxModel: BoxModel, lpModel: LPModel, varNameWidth: string) {
    boxModel.boxes.forEach((boxRow, rowIndex) => {
        if (boxRow.length > 0) {
            // Box >= 0
            lpModel.addConstraint(
                'BCL' + rowIndex,
                0,
                undefined,
                {
                    [boxRow[0].id]: 1
                }
            );
            // GRAPHWIDTH - Box >= BOXWIDTH
            lpModel.addConstraint(
                'BCR' + rowIndex,
                boxRow[boxRow.length - 1].size,
                undefined,
                {
                    [varNameWidth]: 1,
                    [boxRow[boxRow.length - 1].id]: -1
                }
            );

        }
    });
}

function addLinkConstraints(boxModel: BoxModel, lpModel: LPModel) {
    boxModel.links.forEach(link => {
        const portFromBox = boxModel.portToBoxMap.get(link.from);
        const portToBox = boxModel.portToBoxMap.get(link.to);
        // |((BoxFrom + PortFromOffset) - (BoxTo + PortToOffset)| - Link <= 0
        // Case 1: |((BoxFrom + PortFromOffset) - (BoxTo + PortToOffset)| >= 0
        // -> ((BoxFrom + PortFromOffset) - (BoxTo + PortToOffset) - Link <= 0
        // <==>
        // BoxFrom - BoxTto - Link <= PortToOffset - PortFromOffset
        lpModel.addConstraint(
            'LC_' + link.id + '_F-T-L>=0',
            undefined,
            link.to.x - link.from.x,
            {
                [portFromBox.id]: 1,
                [portToBox.id]: -1,
                [link.id]: -1
            }
        );
        // Case 2: |((BoxFrom + PortFromOffset) - (BoxTo + PortToOffset)| <= 0
        // (BoxTo + PortToOffset) - (BoxFrom + PortFromOffset) - Link <= 0
        // <==>
        // BoxTo - BoxFrom - Link <= PortFromOffset - PortToOffset
        lpModel.addConstraint(
            'LC_' + link.id + '_T-F-L>=0',
            undefined,
            link.from.x - link.to.x,
            {
                [portToBox.id]: 1,
                [portFromBox.id]: -1,
                [link.id]: -1
            }
        );

    });
}

export function improvePositions(
    stationBoxes: VisioBox[][],
    groups: { label: string, boxes: VisioBox[]}[],
    connectors: VisioConnector[],
    intraGroupDistance: number,
    interGroupDistance: number) {

    const boxModel = constructBoxModel(stationBoxes, groups, connectors);
    const lpModel = constructLPModel(boxModel, intraGroupDistance, interGroupDistance);

    const lpResult = lpSolve(lpModel);
    lpModel.printConstraints(lpResult);
    lpModel.printObjective(lpResult);
    for (let r = 0; r < stationBoxes.length; r++) {
        for (let c = 0; c < stationBoxes[r].length; c++) {
            stationBoxes[r][c].relPosition.x = lpResult.vars.get(boxModel.boxes[r][c].id);
            stationBoxes[r][c].relPosition.y = stationBoxes[r][c].position.y;
            stationBoxes[r][c].position.x = lpResult.vars.get(boxModel.boxes[r][c].id);
        }
    }
}
