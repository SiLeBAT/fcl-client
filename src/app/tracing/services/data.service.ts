import { Injectable } from '@angular/core';
import {
    StationData, DeliveryData, ObservedType, BasicGraphState, DataServiceData
} from '../data.model';
import * as _ from 'lodash';
import { TracingService } from './tracing.service';
import { HighlightingService } from './highlighting.service';
import { Utils } from '../util/non-ui-utils';

@Injectable({
    providedIn: 'root'
})
export class DataService {

    private cachedState: BasicGraphState;

    private cachedData: DataServiceData;

    constructor(private tracingService: TracingService, private higlightingService: HighlightingService) {}

    getData(state: BasicGraphState): DataServiceData {
        this.applyState(state);
        return { ...this.cachedData };
    }

    private createStations(state: BasicGraphState): {
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

    private createDeliveries(state: BasicGraphState): {
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

    private applyGroupSettings(state: BasicGraphState, data: DataServiceData) {

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

            data.getDelById(group.incoming).forEach(d => d.target = group.id);
            data.getDelById(group.outgoing).forEach(d => d.source = group.id);
            members.forEach(m => m.contained = true);

            data.statMap[group.id] = group;
            data.stations.push(group);
        }
    }

    private applyTracingSettingsToStations(state: BasicGraphState, data: DataServiceData) {
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

    private applyTracingSettingsToDeliveries(state: BasicGraphState, data: DataServiceData) {
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

    private applySelection(state: BasicGraphState, data: DataServiceData) {
        data.stations.forEach(s => s.selected = false);
        data.getStatById(state.selectedElements.stations).forEach(s => s.selected = true);
        data.statSel = Utils.createSimpleStringSet(state.selectedElements.stations);

        data.deliveries.forEach(d => d.selected = false);
        data.getDelById(state.selectedElements.deliveries).forEach(d => d.selected = true);
        data.delSel = Utils.createSimpleStringSet(state.selectedElements.deliveries);
    }

    private updateCache(state: BasicGraphState,
        all = true, groups = true, traceSet = true,
        visibilities = true, score = true, trace = true, selection = true) {
        groups = all || groups;
        traceSet = groups || traceSet;
        visibilities = traceSet || visibilities;
        score = visibilities || score;
        trace = visibilities || trace;
        selection = groups || visibilities || selection;

        if (all) {
            this.cachedData = {
                ...this.createStations(state),
                ...this.createDeliveries(state),
                statSel: undefined,
                delSel: undefined,
                statVis: undefined,
                tracingResult: undefined,
                legendInfo: undefined
            };
        }
        if (groups) {
            this.applyGroupSettings(state, this.cachedData);
        }
        if (traceSet) {
            this.applyTracingSettingsToStations(state, this.cachedData);
            this.applyTracingSettingsToDeliveries(state, this.cachedData);
        }
        if (visibilities) {
            this.higlightingService.applyVisibilities(state, this.cachedData);
        }
        if (score) {
            this.tracingService.updateScores(this.cachedData, { crossContTraceType: state.tracingSettings.crossContTraceType });
        }
        if (trace) {
            this.tracingService.updateTrace(this.cachedData, { crossContTraceType: state.tracingSettings.crossContTraceType });
        }
        if (visibilities || score || trace) {
            this.higlightingService.applyHighlightingProps(state, this.cachedData);
        }
        if (selection) {
            this.applySelection(state, this.cachedData);
        }
    }

    private applyState(state: BasicGraphState) {
        if (
            !this.cachedState ||
            this.cachedState.fclElements !== state.fclElements
         ) {
            this.updateCache(state);
        } else if (this.cachedState.groupSettings !== state.groupSettings) {
            this.updateCache(state, false);
        } else if (this.cachedState.tracingSettings !== state.tracingSettings) {
            this.updateCache(state, false, false);
        } else if (
            this.cachedState.highlightingSettings !== state.highlightingSettings ||
            this.cachedState.highlightingSettings.invisibleStations !== state.highlightingSettings.invisibleStations
        ) {
            this.updateCache(state, false, false, false, true);
        } else if (this.cachedState.selectedElements !== state.selectedElements) {
            this.updateCache(state, false, false, false, false, false, false);
        }
        this.cachedState = { ...state };
    }

}
