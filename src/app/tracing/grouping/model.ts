import {
    StationData, GroupType, GroupData,
    StationTracingSettings, Position, DataServiceInputState
} from '../data.model';

export interface SetStationGroupsPayload {
    groupSettings: GroupData[];
    stationTracingSettings: StationTracingSettings[];
    stationPositions: { [key: string]: Position };
    selectedStations: string[];
    invisibleStations: string[];
}

export interface GroupingChange {
    addGroups: GroupData[];
    removeGroups: GroupData[];
}

export interface GroupingState extends DataServiceInputState {
    stationPositions: { [key: string]: Position };
}

export interface LinkGroup {
    linkStation: StationData;
    linkedStations: {
        linkedStation: StationData;
        linkKeys: string[];
    }[];
}

export type GroupInfoFun = (linkGroup: LinkGroup, groupNumber: number) => { id: string; name: string; groupType: GroupType };

export interface IsolatedComponent {
    ids: string[];
    support: string[];
}
