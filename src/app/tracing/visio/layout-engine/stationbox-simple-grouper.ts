import * as _ from 'lodash';
import { VisioBox, Position, Size, BoxType } from './datatypes';
import { LabelCreator } from './label-creator';
import { Utils } from '../../util/non-ui-utils';
import { GraphSettings } from './graph-settings';

interface BoxGroup {
    label: string;
    boxes: VisioBox[];
}

interface VisualBoxGroup {
    position: Position;
    size: Size;
    logicalGroupIndex: number;
    label: string;
    boxes: VisioBox[];
}

export function groupStationBoxes(logicalBoxGroups: BoxGroup[], labelCreator: LabelCreator): VisioBox[] {
    addTopAndLeftMargin([].concat(...logicalBoxGroups.map(g => g.boxes)));
    let visGroups = initVisualGroups(logicalBoxGroups);
    visGroups = aggregateVisualGroups(visGroups);
    return visGroups.map(g => convertToVisioBox(g, labelCreator));
}

function addTopAndLeftMargin(boxes: VisioBox[]) {
    const left = Math.min(...boxes.map(b => b.position.x)) - GraphSettings.GRID_MARGIN - GraphSettings.GROUP_MARGIN;
    boxes.forEach(b => b.position = Utils.difference(b.position, { x: left, y: 0 }));
}

function convertToVisioBox(visBox: VisualBoxGroup, labelCreator: LabelCreator): VisioBox {
    const LEFTMARGIN = GraphSettings.GROUP_MARGIN;
    const RIGHTMARGIN = GraphSettings.GROUP_MARGIN;
    const TOPMARGIN = GraphSettings.GROUP_MARGIN + GraphSettings.GROUP_HEADER_HEIGHT;
    const BOTTOMMARGIN = GraphSettings.GROUP_MARGIN;
    const visioBox: VisioBox = {
        type: BoxType.StationGroup,
        relPosition: {
            x: visBox.position.x - LEFTMARGIN,
            y: visBox.position.y - TOPMARGIN
        },
        size: {
            width: visBox.size.width + LEFTMARGIN + RIGHTMARGIN,
            height: visBox.size.height + TOPMARGIN + BOTTOMMARGIN
        },
        position: null,
        ports: [],
        elements: visBox.boxes,
        shape: null,
        label: labelCreator.getLabel([visBox.label], GraphSettings.GROUP_MARGIN)
    };

    visioBox.elements.forEach(b => b.relPosition = Utils.difference(b.position, visioBox.relPosition));

    return visioBox;
}

function initVisualGroups(logicalBoxGroups: BoxGroup[]): VisualBoxGroup[] {
    const result: VisualBoxGroup[] = [];
    logicalBoxGroups.forEach((logBoxGroup, groupIndex) =>
        logBoxGroup.boxes.forEach(box => {
            result.push({
                position: { ...box.position },
                size: { ...box.size },
                logicalGroupIndex: groupIndex,
                label: logBoxGroup.label,
                boxes: [box]
            });
        })
    );
    return result;
}

function aggregateVisualGroups(visGroups: VisualBoxGroup[]): VisualBoxGroup[] {
    visGroups = aggregateHorizontally(visGroups);
    visGroups = aggregateVertically(visGroups);
    return visGroups;
}

function aggregateHorizontally(visGroups: VisualBoxGroup[]): VisualBoxGroup[] {
    visGroups.sort(
        (b1: VisualBoxGroup, b2: VisualBoxGroup) => {
            return b1.position.y !== b2.position.y ? b1.position.y - b2.position.y : b1.position.x - b2.position.x;
        }
    );
    let i = 0;
    while (i < visGroups.length - 1) {
        if (
            visGroups[i].logicalGroupIndex === visGroups[i + 1].logicalGroupIndex &&
            visGroups[i].position.y === visGroups[i + 1].position.y
           ) {

            visGroups[i] = mergeGroups([ visGroups[i], visGroups[i + 1] ]);
            visGroups.splice(i + 1, 1);

        } else {
            i++;
        }
    }
    return visGroups;
}

function aggregateVertically(visGroups: VisualBoxGroup[]): VisualBoxGroup[] {
    let i1 = 0;
    while (i1 < visGroups.length) {
        let i2 = i1 + 1;
        while (i2 < visGroups.length) {
            const mergeBox1 = visGroups[i1];
            const mergeBox2 = visGroups[i2];
            if (
                mergeBox1.logicalGroupIndex === mergeBox2.logicalGroupIndex &&
                !visGroups.some((testBox) => !doesMergeRespectBox(mergeBox1, mergeBox2, testBox))
               ) {
                // mergeGroups
                visGroups[i1] = mergeGroups([mergeBox1, mergeBox2]);
                visGroups.splice(i2, 1);
            } else {
                i2++;
            }
        }
        i1++;
    }
    return visGroups;
}

function doesMergeRespectBox(mergeBox1: VisualBoxGroup, mergeBox2: VisualBoxGroup, testBox: VisualBoxGroup): boolean {
    if (testBox === mergeBox1 || testBox === mergeBox2) {
        return true;
    } else {
        const MARGIN = GraphSettings.GROUP_MARGIN + GraphSettings.GRID_MARGIN / 2;
        const mergeLeft = Math.min(mergeBox1.position.x, mergeBox2.position.x) - MARGIN;
        const mergeTop = Math.min(mergeBox1.position.y, mergeBox2.position.y)
            - (MARGIN + GraphSettings.GROUP_HEADER_HEIGHT);
        const mergeRight = Math.max(mergeBox1.position.x + mergeBox1.size.width, mergeBox2.position.x + mergeBox2.size.width) + MARGIN;
        const mergeBottom = Math.max(mergeBox1.position.y + mergeBox1.size.height, mergeBox2.position.y + mergeBox2.size.height) + MARGIN;

        const testLeft = testBox.position.x - MARGIN;
        const testTop = testBox.position.y - (MARGIN + GraphSettings.GROUP_HEADER_HEIGHT);
        const testRight = testBox.position.x + testBox.size.width + MARGIN;
        const testBottom = testBox.position.y + testBox.size.height + MARGIN;

        return testLeft > mergeRight || testRight < mergeLeft || testTop > mergeBottom || testBottom < mergeTop;

    }
}

function mergeGroups(groups: VisualBoxGroup[]): VisualBoxGroup {
    const left = Math.min(...groups.map(g => g.position.x));
    const top = Math.min(...groups.map(g => g.position.y));
    const right = Math.max(...groups.map(g => g.position.x + g.size.width));
    const bottom = Math.max(...groups.map(g => g.position.y + g.size.height));
    return {
        position: { x: left, y: top },
        size: {
            width: right - left,
            height: bottom - top
        },
        logicalGroupIndex: groups[0].logicalGroupIndex,
        label: groups[0].label,
        boxes: [].concat(...groups.map(g => g.boxes))
    };
}
