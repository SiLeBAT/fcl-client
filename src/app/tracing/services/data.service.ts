import { Injectable } from '@angular/core';
import {
    StationData, DeliveryData, ObservedType, DataServiceData, DataServiceInputState
} from '../data.model';
import * as _ from 'lodash';
import { TracingService } from './tracing.service';
import { HighlightingService } from './highlighting.service';
import { Utils } from '../util/non-ui-utils';

interface CacheUpdateOptions {
    updateAll: boolean;
    updateGroups: boolean;
    updateTraceSet: boolean;
    updateVisibilities: boolean;
    updateScore: boolean;
    updateTrace: boolean;
    updateHighlighting: boolean;
    updateSelection: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private cachedState: DataServiceInputState | null = null;

    private cachedData: DataServiceData | null = null;

    constructor(private tracingService: TracingService, private higlightingService: HighlightingService) {}

    getData(state: DataServiceInputState): DataServiceData {
        this.applyState(state);
        return { ...this.cachedData };
    }

    private createStations(state: DataServiceInputState): {
        statMap: { [key: string]: StationData },
        stations: StationData[],
        getStatById(stationIds: string[]): StationData[]
    } {
        const stations: StationData[] = state.fclElements.stations.map(storeData => ({
            ...storeData,
            isMeta: false,
            contained: false,
            outbreak: false,
            weight: 0,
            forward: false,
            backward: false,
            crossContamination: false,
            killContamination: false,
            observed: ObservedType.NONE,
            score: 0,
            commonLink: false,
            selected: false,
            invisible: false,
            expInvisible: false,
            contains: [],
            groupType: null,
            incoming: storeData.incoming.slice(),
            outgoing: storeData.outgoing.slice(),
            connections: storeData.connections.slice(),
            properties: storeData.properties.map(p => Object.assign({}, p))
        }));

        const idToStationMap: {[key: string]: StationData } = {};
        for (const station of stations) {
            idToStationMap[station.id] = station;
        }
        return {
            statMap: idToStationMap,
            stations: stations,
            getStatById: (stationIds: string[]) => stationIds.map(id => idToStationMap[id])
        };
    }

    private createDeliveries(state: DataServiceInputState): {
        delMap: { [key: string]: DeliveryData },
        deliveries: DeliveryData[],
        getDelById(deliveryIds: string[]): DeliveryData[]
    } {
        const deliveries: DeliveryData[] = state.fclElements.deliveries.map(storeData => ({
            ...storeData,
            weight: 0,
            forward: false,
            backward: false,
            crossContamination: false,
            killContamination: false,
            observed: ObservedType.NONE,
            score: 0,
            selected: false,
            invisible: false,
            expInvisible: false,
            originalSource: storeData.source,
            originalTarget: storeData.target,
            properties: storeData.properties.map(p => Object.assign({}, p))
        }));

        const idToDeliveryMap: {[key: string]: DeliveryData } = {};
        deliveries.forEach(delivery => idToDeliveryMap[delivery.id] = delivery);

        return {
            delMap: idToDeliveryMap,
            deliveries: deliveries,
            getDelById: (deliveryIds: string[]) => deliveryIds.map(id => idToDeliveryMap[id])
        };
    }

    private applyGroupSettings(state: DataServiceInputState, data: DataServiceData) {

        if (this.cachedState && this.cachedState.fclElements === state.fclElements) {
            // remove old groups
            for (const group of this.cachedState.groupSettings) {
                const members = data.getStatById(group.contains);
                members.forEach(member => {
                    member.contained = false;
                    data.getDelById(member.incoming).forEach(d => d.target = member.id);
                    data.getDelById(member.outgoing).forEach(d => d.source = member.id);
                });
                delete data.statMap[group.id];
            }

            const simpleStationCount = state.fclElements.stations.length;
            data.stations = data.stations.slice(0, simpleStationCount);
        }

        // new groups
        for (const groupSet of state.groupSettings) {
            const members = data.getStatById(groupSet.contains);
            const lats = members.map(m => m.lat);
            const lons = members.map(m => m.lon);
            const lat = lats.every(value => value !== null) && lons.every(value => value !== null) ? _.mean(lats) : null;
            const lon = lat !== null ? _.mean(lons) : null;
            const group: StationData = {
                ...groupSet,
                lat: lat,
                lon: lon,
                isMeta: true,
                contained: false,
                contains: groupSet.contains.slice(),
                observed: ObservedType.NONE,
                selected: false,
                invisible: false,
                expInvisible: false,
                outbreak: false,
                weight: 0,
                forward: false,
                backward: false,
                crossContamination: false,
                killContamination: false,
                commonLink: false,
                score: 0,
                incoming: [].concat(...members.map(m => m.incoming)),
                outgoing: [].concat(...members.map(m => m.outgoing)),
                connections: [].concat(...members.map(m => m.connections)),
                properties: []
            };

            this.applyConsensusPropsToGroup(members, group);

            data.getDelById(group.incoming).forEach(d => d.target = group.id);
            data.getDelById(group.outgoing).forEach(d => d.source = group.id);
            members.forEach(m => m.contained = true);

            data.statMap[group.id] = group;
            data.stations.push(group);
        }
    }

    private applyConsensusPropsToGroup(members: StationData[], group: StationData): void {
        const cprops = Utils.createObjectFromArray(members[0].properties, p => p.name, p => p.value);

        for (const member of members) {
            const propCheck = Utils.createSimpleStringSet(Object.keys(cprops));
            for (const prop of member.properties) {
                const value = cprops[prop.name];
                if (value !== undefined) {
                    if (prop.value !== value) {
                        delete cprops[prop.name];
                    }
                    delete propCheck[prop.name];
                }
            }
            for (const propName of Object.keys(propCheck)) {
                delete cprops[propName];
            }
        }
        group.properties = members[0].properties.filter(p => cprops[p.name] !== undefined);
    }

    private applyTracingSettingsToStations(state: DataServiceInputState, data: DataServiceData) {
        for (const traceSet of state.tracingSettings.stations) {
            const station = data.statMap[traceSet.id];
            if (station) {
                station.outbreak = traceSet.outbreak;
                station.observed = traceSet.observed;
                station.crossContamination = traceSet.crossContamination,
                station.killContamination = traceSet.killContamination,
                station.weight = traceSet.weight;
            }
        }
    }

    private applyTracingSettingsToDeliveries(state: DataServiceInputState, data: DataServiceData) {
        for (const traceSet of state.tracingSettings.deliveries) {
            const delivery = data.delMap[traceSet.id];
            if (delivery) {
                delivery.observed = traceSet.observed;
                delivery.crossContamination = traceSet.crossContamination,
                delivery.killContamination = traceSet.killContamination,
                delivery.weight = traceSet.weight;
            }
        }
    }

    private applySelection(state: DataServiceInputState, data: DataServiceData) {

        data.stations.forEach(s => s.selected = false);
        data.getStatById(state.selectedElements.stations).forEach(s => s.selected = true);
        data.statSel = Utils.createSimpleStringSet(state.selectedElements.stations);

        data.deliveries.forEach(d => d.selected = false);
        data.getDelById(state.selectedElements.deliveries).forEach(d => d.selected = true);
        data.delSel = Utils.createSimpleStringSet(state.selectedElements.deliveries);
    }

    private getFullCacheUpdateOptions(options: Partial<CacheUpdateOptions>): CacheUpdateOptions {
        const updateAll = options.updateAll === true;
        const updateGroups = updateAll || options.updateGroups;
        const updateTraceSet = updateGroups || options.updateTraceSet;
        const updateVisibilities = updateTraceSet || options.updateVisibilities;
        const updateScore = updateVisibilities || options.updateScore;
        const updateTrace = updateVisibilities || options.updateTrace;
        const updateHighlighting = updateVisibilities || updateScore || updateTrace || options.updateHighlighting;
        const updateSelection = updateGroups || updateVisibilities || options.updateSelection;

        return {
            updateAll: updateAll,
            updateGroups: updateGroups,
            updateSelection: updateSelection,
            updateVisibilities: updateVisibilities,
            updateTraceSet: updateTraceSet,
            updateHighlighting: updateHighlighting,
            updateScore: updateScore,
            updateTrace: updateTrace
        };
    }

    private updateCache(state: DataServiceInputState, options: Partial<CacheUpdateOptions>) {
        options = this.getFullCacheUpdateOptions(options);

        if (options.updateAll) {
            this.cachedData = {
                ...this.createStations(state),
                ...this.createDeliveries(state),
                statSel: {},
                delSel: {},
                statVis: {},
                delVis: {},
                tracingPropsUpdatedFlag: {},
                stationAndDeliveryHighlightingUpdatedFlag: {},
                legendInfo: undefined,
                highlightingStats: undefined
            };
        }
        if (options.updateGroups) {
            this.applyGroupSettings(state, this.cachedData);
        }
        if (options.updateTraceSet) {
            this.applyTracingSettingsToStations(state, this.cachedData);
            this.applyTracingSettingsToDeliveries(state, this.cachedData);
        }

        if (options.updateVisibilities) {
            this.higlightingService.applyVisibilities(state, this.cachedData);
        }

        if (options.updateScore) {
            this.tracingService.updateScores(this.cachedData, { crossContTraceType: state.tracingSettings.crossContTraceType });
        }
        if (options.updateTrace) {
            this.tracingService.updateTrace(this.cachedData, { crossContTraceType: state.tracingSettings.crossContTraceType });
        }
        if (options.updateHighlighting) {
            this.higlightingService.applyHighlightingProps(state, this.cachedData);
            this.cachedData.stationAndDeliveryHighlightingUpdatedFlag = {};
        }
        if (options.updateSelection) {
            this.applySelection(state, this.cachedData);
        }

        if (options.updateTrace || options.updateScore || options.updateTraceSet) {
            this.cachedData.tracingPropsUpdatedFlag = {};
        }
    }

    private applyState(state: DataServiceInputState) {
        if (
            !this.cachedState ||
            this.cachedState.fclElements !== state.fclElements
        ) {
            // new data model was loaded
            this.updateCache(state, { updateAll: true });
        } else if (
            this.cachedState.groupSettings !== state.groupSettings &&
            !_.isEqual(this.cachedState.groupSettings, state.groupSettings)
        ) {
            // group settings changed
            this.updateCache(state, { updateGroups: true });
        } else if (
            this.cachedState.highlightingSettings !== state.highlightingSettings ||
            this.cachedState.highlightingSettings.invisibleStations !== state.highlightingSettings.invisibleStations ||
            this.cachedState.highlightingSettings.invisibleDeliveries !== state.highlightingSettings.invisibleDeliveries
        ) {
            // station/delivery related highlightingSettings changed
            this.updateCache(state, {
                updateVisibilities: true,
                updateHighlighting: true
            });
        } else if (
            this.cachedState.tracingSettings !== state.tracingSettings &&
            !_.isEqual(this.cachedState.tracingSettings, state.tracingSettings)
        ) {
            this.updateCache(state, { updateTraceSet: true });
        } else if (this.cachedState.selectedElements !== state.selectedElements) {
            this.updateCache(state, { updateSelection: true });
        }
        this.cachedState = { ...state };
    }

}
