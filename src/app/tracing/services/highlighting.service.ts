import { Injectable } from '@angular/core';
import {
    DataServiceData, BasicGraphState, SetHighlightingSettingsPayload, HighlightingSettings
} from '../data.model';
import { Utils } from '../util/non-ui-utils';

@Injectable({
    providedIn: 'root'
})
export class HighlightingService {

    getMarkStationsInvisiblePayload(state: HighlightingSettings, stationIds: string[], invisible: boolean): SetHighlightingSettingsPayload {
        let invisibleStations: string[] = [];
        if (invisible) {
            invisibleStations = [].concat(state.invisibleStations, stationIds);
        } else {
            const visibleMap = Utils.createStringSet(stationIds);
            invisibleStations = state.invisibleStations.filter(id => !visibleMap[id]);
        }
        return {
            highlightingSettings: {
                invisibleStations: invisibleStations
            }
        };
    }

    getClearInvisiblitiesPayload(state: HighlightingSettings): SetHighlightingSettingsPayload {
        return {
            highlightingSettings: {
                invisibleStations: []
            }
        };
    }

    applyVisibilities(state: BasicGraphState, data: DataServiceData) {
        data.stations.forEach(s => s.invisible = false);
        data.getStatById(state.highlightingSettings.invisibleStations).filter(s => s !== null).forEach(s => s.invisible = true);
        data.statVis = Utils.createStringSet(data.stations.filter(s => !s.invisible).map(s => s.id));
    }

    hasStationVisibilityChanged(oldState: BasicGraphState, newState: BasicGraphState): boolean {
        return !oldState || oldState.highlightingSettings.invisibleStations !== newState.highlightingSettings.invisibleStations;
    }

    hasDeliveryVisibilityChanged(oldState: BasicGraphState, newState: BasicGraphState): boolean {
        return !oldState;
    }
}
