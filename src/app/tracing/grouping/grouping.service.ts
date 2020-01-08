import { Injectable } from '@angular/core';
import { DataService } from '../services/data.service';
import {
    GroupType, GroupData, StationTracingSettings, ObservedType, GroupMode, Position
} from '../data.model';
import { Utils } from '../util/non-ui-utils';
import * as _ from 'lodash';
import { GroupingState, GroupingChange, SetStationGroupsPayload } from './model';
import { SourceCollapser } from './source-collapser';
import { TargetCollapser } from './target-collapser';
import { SimpleChainCollapser } from './simple-chain-collapser';
import { IsolatedComponentCollapser } from './isolated-component-collapser';
import { MergeStationsValidationCode } from './validation-codes';

interface EffectiveGroupingChange extends GroupingChange {
    unchangedGroups: GroupData[];
}

@Injectable({
    providedIn: 'root'
})
export class GroupingService {

    constructor(private dataService: DataService) {
    }

    getMergeStationsPayload(state: GroupingState, groupName: string, memberIds: string[]): SetStationGroupsPayload {
        if (this.validateMergeStationsCmd(state, groupName, memberIds) !== MergeStationsValidationCode.OK) {
            return null;
        }
        return this.getNewGroupingState(state, this.getEffectiveGroupingChange(state, {
            addGroups: [{
                id: groupName,
                name: groupName,
                contains: this.explodeIds(state, memberIds),
                groupType: null
            }],
            removeGroups: []
        }));
    }

    validateMergeStationsCmd(state: GroupingState, groupName: string, memberIds: string[]): MergeStationsValidationCode {
        if (!groupName || groupName.length === 0) {
            return MergeStationsValidationCode.NAME_OR_ID_MAY_NOT_BE_EMPTY;
        } else {
            const effChange = this.getEffectiveGroupingChange(state, {
                addGroups: [{
                    id: groupName,
                    name: groupName,
                    contains: this.explodeIds(state, memberIds),
                    groupType: null
                }],
                removeGroups: []
            });

            const removeGrpMap = Utils.createObjectMap(effChange.removeGroups, g => g.id);
            const remainingGrps = state.groupSettings.filter(g => !removeGrpMap[g.id]);
            const reservedIds = Utils.createStringSet([].concat(
                ...state.fclElements.stations.map(s => s.id),
                ...remainingGrps.map(g => g.id)
            ));
            const reservedNames = Utils.createStringSet([].concat(
                ...state.fclElements.stations.map(s => s.name),
                ...remainingGrps.map(g => g.name)
            ).filter(name => name !== undefined && name !== null));

            if (reservedIds[groupName]) {
                return MergeStationsValidationCode.ID_IS_NOT_UNIQUE;
            } else if (reservedNames[groupName]) {
                return MergeStationsValidationCode.NAME_IS_NOT_UNIQUE;
            } else {
                return MergeStationsValidationCode.OK;
            }
        }
    }

    private explodeIds(state: GroupingState, memberIds: string[]): string[] {
        const grpMap = Utils.createMap(state.groupSettings, g => g.id);
        return [].concat(
            ...memberIds.map(id => grpMap[id] ? grpMap[id].contains : [id])
        );
    }

    getCollapseStationsPayload(state: GroupingState, groupType: GroupType, groupMode: GroupMode): SetStationGroupsPayload {
        let groupChange: GroupingChange;
        switch (groupType) {
            case GroupType.SOURCE_GROUP:
                groupChange = new SourceCollapser(this.dataService).getGroupingChange(state, groupMode);
                break;
            case GroupType.TARGET_GROUP:
                groupChange = new TargetCollapser(this.dataService).getGroupingChange(state, groupMode);
                break;
            case GroupType.SIMPLE_CHAIN:
                groupChange = new SimpleChainCollapser(this.dataService).getGroupingChange(state);
                break;
            case GroupType.ISOLATED_GROUP:
                groupChange = new IsolatedComponentCollapser(this.dataService).getGroupingChange(state);
                break;
            default:
                return null;
        }

        return this.getNewGroupingState(state, this.getEffectiveGroupingChange(state, groupChange));
    }

    getUncollapseStationsPayload(state: GroupingState, groupType: GroupType): SetStationGroupsPayload {
        const removeGroups = state.groupSettings.filter(g => g.groupType === groupType);

        if (removeGroups.length > 0) {
            return this.getNewGroupingState(state, { addGroups: [], removeGroups: removeGroups });
        }
        return null;
    }

    getExpandStationsPayload(state: GroupingState, stationIds: string[]): SetStationGroupsPayload {
        const idSet = Utils.createStringSet(stationIds);
        const removeGroups = state.groupSettings.filter(g => !!idSet[g.id]);

        if (removeGroups.length > 0) {
            return this.getNewGroupingState(state, { addGroups: [], removeGroups: removeGroups });
        }
        return null;
    }

    private getUpdatedPositions(state: GroupingState, groupingChange: GroupingChange): { [key: string]: Position } {
        const stationPositions = Object.assign({}, state.stationPositions);
        for (const group of groupingChange.removeGroups) {
            const pos = stationPositions[group.id];
            for (const stationId of group.contains) {
                stationPositions[stationId] = Utils.sum(pos, stationPositions[stationId]);
            }
            delete stationPositions[group.id];
        }
        for (const group of groupingChange.addGroups) {
            const pos = Utils.getCenter(
                group.contains.map(stationId => stationPositions[stationId])
            );
            for (const stationId of group.contains) {
                stationPositions[stationId] = Utils.difference(stationPositions[stationId], pos);
            }
            stationPositions[group.id] = pos;
        }
        return stationPositions;
    }

    private getUpdatedTracingSettings(state: GroupingState, groupingChange: GroupingChange): StationTracingSettings[] {
        const removeIds = Utils.createObjectStringSet(groupingChange.removeGroups.map(g => g.id));
        const idToSettingMap = Utils.createObjectMap(state.tracingSettings.stations, (s) => s.id);
        return [].concat(
            state.tracingSettings.stations.filter(s => !removeIds[s.id]),
            groupingChange.addGroups.map(group => {
                let weight = 0;
                let crossContamination = true;
                let killContamination = true;
                let observed: ObservedType;
                for (const stationId of group.contains) {
                    const setting = idToSettingMap[stationId];
                    weight += setting.weight;
                    crossContamination = crossContamination && setting.crossContamination;
                    killContamination = killContamination && setting.killContamination;
                    observed = (!observed || setting.observed === observed ? setting.observed : ObservedType.NONE);
                }
                return {
                    id: group.id,
                    weight: weight,
                    killContamination: killContamination,
                    crossContamination: crossContamination,
                    observed: observed,
                    outbreak: weight > 0
                };
            })
        );
    }

    private getUpdatedGroupSettings(state: GroupingState, groupingChange: GroupingChange): GroupData[] {
        const removeIds = Utils.createObjectStringSet(groupingChange.removeGroups.map(g => g.id));
        const remainingGroups = state.groupSettings.filter(g => !removeIds[g.id]);
        const reservedIds = Utils.createObjectStringSet([].concat(
            state.fclElements.stations.map(s => s.id),
            remainingGroups.map(g => g.id)
        ));
        const newGroups = groupingChange.addGroups.slice();
        for (const group of newGroups) {
            let id = group.id || group.name;
            let i = 1;
            while (reservedIds[id]) {
                i++;
                id = (group.id || group.name) + '(' + i + ')';
            }
            group.id = id;
        }
        return [].concat(
            remainingGroups,
            newGroups
        );
    }

    private getUpdatedSelection(state: GroupingState, groupingChange: GroupingChange): string[] {
        const selectedStationIds = Utils.createObjectStringSet(state.selectedElements.stations);
        for (const group of groupingChange.removeGroups) {
            if (selectedStationIds[group.id]) {
                for (const stationId of group.contains) {
                    selectedStationIds[stationId] = true;
                }
                delete selectedStationIds[group.id];
            }
        }
        for (const group of groupingChange.addGroups) {
            for (const stationId of group.contains) {
                if (selectedStationIds[stationId]) {
                    selectedStationIds[group.id] = true;
                    delete selectedStationIds[stationId];
                }
            }
        }
        return Object.keys(selectedStationIds);
    }

    private getUpdatedInvisibilities(state: GroupingState, groupingChange: GroupingChange): string[] {
        const removeIds = Utils.createObjectStringSet(groupingChange.removeGroups.map(g => g.id));
        return state.highlightingSettings.invisibleStations.filter(id => !removeIds[id]);
    }

    private getNewGroupingState(state: GroupingState, groupingChange: GroupingChange): SetStationGroupsPayload {
        return {
            groupSettings: this.getUpdatedGroupSettings(state, groupingChange),
            stationTracingSettings: this.getUpdatedTracingSettings(state, groupingChange),
            stationPositions: this.getUpdatedPositions(state, groupingChange),
            selectedStations: this.getUpdatedSelection(state, groupingChange),
            invisibleStations: this.getUpdatedInvisibilities(state, groupingChange)
        };
    }

    private getEffectiveGroupingChange(state: GroupingState, groupChange: GroupingChange): EffectiveGroupingChange {

        const addGroupMap = Utils.createObjectMap(groupChange.addGroups, g => g.id);
        let effRemoveGroups: GroupData[] = [];
        const unchangedGroups: GroupData[] = [];

        // check whether removeGroups are truely remove Groups
        for (const removeGroup of groupChange.removeGroups) {
            const addGroup = addGroupMap[removeGroup.id];
            if (
                addGroup &&
                addGroup.name === removeGroup.name &&
                addGroup.groupType === removeGroup.groupType &&
                addGroup.contains.every(id => removeGroup.contains.indexOf(id) !== -1)
            ) {
                // no effective change here (addGroup is identical to removeGroup)
                unchangedGroups.push(addGroup);
                delete addGroupMap[addGroup.id];
            } else {
                effRemoveGroups.push(removeGroup);
            }
        }

        const effAddGroups = groupChange.addGroups.filter(g => addGroupMap[g.id]);
        const effRemoveGroupsMap = Utils.createMap(effRemoveGroups, g => g.id);
        const newMembersMap = Utils.createStringSet([].concat(...effAddGroups.map(g => g.contains)));

        effRemoveGroups = [].concat(
            effRemoveGroups,
            state.groupSettings.filter(g => !effRemoveGroupsMap[g.id] && g.contains.some(mId => newMembersMap[mId]))
        );

        return {
            addGroups: effAddGroups,
            removeGroups: effRemoveGroups,
            unchangedGroups: unchangedGroups
        };
    }

    hasGroupingChanged(oldState: GroupingState, newState: GroupingState): boolean {
        return (
            !oldState ||
            oldState.groupSettings !== newState.groupSettings
        );
    }
}
