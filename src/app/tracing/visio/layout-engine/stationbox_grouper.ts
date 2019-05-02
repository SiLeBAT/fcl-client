import * as _ from 'lodash';
// import {Solver} from 'javascript-lp-solver';
import { lpSolve, LPModel, LPResult } from '../../../shared/lp_solver';
import { VisioBox, VisioConnector, VisioPort, Position } from './datatypes';
import { Utils } from '../../util/utils';
import { GraphSettings } from './graph-settings';

interface BoxGroup {
    label: string;
    boxes: VisioBox[];
}
interface ExtendedBoxGroup extends BoxGroup {
    links: Link[];
}
interface Rectangle {
    left: number;
    right: number;
    top: number;
    bottom;
}

interface Link {
    rect: Rectangle;
    logicalGroupIndex: number;
    visualGroupIndex: number;
}

const X_MIN_DISTANCE = 4 * (GraphSettings.GRID_MARGIN + GraphSettings.GROUP_MARGIN);
const Y_MIN_DISTANCE = X_MIN_DISTANCE + GraphSettings.SECTION_DISTANCE + GraphSettings.GROUP_HEADER_HEIGHT;

export function groupStationBoxes(logicalBoxGroups: BoxGroup[]): VisioBox[] {
    /*const allBoxes: VisioBox[] = [].concat(...logicalBoxGroups.map(bg => bg.boxes));

    const linkCandidates: Link[] = getPotentialLinks();
    const newLinks: Link[] = removeConflicts();

    */
    return null;
}
