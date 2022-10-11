import { Action } from '@ngrx/store';
import { GroupType, GroupMode } from '../data.model';

export enum GroupingActionTypes {
    MergeStationsMSA = '[Tracing] Merge Stations',
    CollapseStationsMSA = '[Tracing] Collapse Stations',
    UncollapseStationsMSA = '[Tracing] Uncollapse Stations',
    ExpandStationsMSA = '[Tracing] Expand Stations'
}

export class MergeStationsMSA implements Action {
    readonly type = GroupingActionTypes.MergeStationsMSA;

    constructor(public payload: { memberIds: string[] }) {}
}

export class CollapseStationsMSA implements Action {
    readonly type = GroupingActionTypes.CollapseStationsMSA;

    constructor(public payload: { groupType: GroupType; groupMode?: GroupMode }) {}
}

export class UncollapseStationsMSA implements Action {
    readonly type = GroupingActionTypes.UncollapseStationsMSA;

    constructor(public payload: { groupType: GroupType }) {}
}

export class ExpandStationsMSA implements Action {
    readonly type = GroupingActionTypes.ExpandStationsMSA;

    constructor(public payload: { stationIds: string[] }) {}
}

export type GroupingActions =
      MergeStationsMSA
    | CollapseStationsMSA
    | UncollapseStationsMSA
    | MergeStationsMSA
    | ExpandStationsMSA;
