import { Injectable } from '@angular/core';
import {
    DataServiceData, StationData, DeliveryData, SetTracingSettingsPayload,
    TracingSettings, ObservedType
} from '../data.model';
import { Utils } from '../util/non-ui-utils';

@Injectable({
    providedIn: 'root'
})
export class TracingService {

    private visitedStats: { [key: string]: boolean };
    private visitedDels: { [key: string]: boolean };

    constructor() {}

    getClearOutbreakStationsPayload(tracingSettings: TracingSettings): SetTracingSettingsPayload {
        return this.getMarkStationsAsOutbreakPayload(
            tracingSettings,
            tracingSettings.stations.filter(s => s.outbreak).map(s => s.id),
            false
        );
    }

    getMarkStationsAsOutbreakPayload(tracingSettings: TracingSettings, ids: string[], outbreak: boolean): SetTracingSettingsPayload {
        const weight = (outbreak ? 1 : 0);
        const idSet = Utils.createSimpleStringSet(ids);
        return {
            tracingSettings: {
                ...tracingSettings,
                stations: tracingSettings.stations.map(s => ({
                    ...s,
                    ...(idSet[s.id] ? { outbreak: outbreak, weight: weight } : { outbreak: s.outbreak, weight: s.weight })
                }))
            }
        };
    }

    getSetStationCrossContPayload(tracingSettings: TracingSettings, ids: string[], crossContamination: boolean): SetTracingSettingsPayload {
        const idSet = Utils.createSimpleStringSet(ids);
        return {
            tracingSettings: {
                ...tracingSettings,
                stations: tracingSettings.stations.map(s => ({
                    ...s,
                    crossContamination: (idSet[s.id] ? crossContamination : s.crossContamination)
                }))
            }
        };
    }

    getSetStationKillContPayload(tracingSettings: TracingSettings, ids: string[], killContamination: boolean): SetTracingSettingsPayload {
        const idSet = Utils.createSimpleStringSet(ids);
        return {
            tracingSettings: {
                ...tracingSettings,
                stations: tracingSettings.stations.map(s => ({
                    ...s,
                    crossContamination: (idSet[s.id] && killContamination ? false : s.crossContamination),
                    killContamination: (idSet[s.id] ? killContamination : s.killContamination)
                }))
            }
        };
    }

    getClearTracePayload(tracingSettings: TracingSettings): SetTracingSettingsPayload {
        return {
            tracingSettings: {
                ...tracingSettings,
                stations: tracingSettings.stations.map(s => ({
                    ...s,
                    observed: ObservedType.NONE
                })),
                deliveries: tracingSettings.deliveries.map(d => ({
                    ...d,
                    observed: ObservedType.NONE
                }))
            }
        };
    }

    getShowStationTracePayload(tracingSettings: TracingSettings, id: string, observed: ObservedType): SetTracingSettingsPayload {
        return {
            tracingSettings: {
                ...tracingSettings,
                deliveries: tracingSettings.deliveries.map(s => ({
                    ...s,
                    observed: ObservedType.NONE
                })),
                stations: tracingSettings.stations.map(s => ({
                    ...s,
                    observed: (s.id === id ? observed : ObservedType.NONE)
                }))
            }
        };
    }

    getShowDeliveryTracePayload(tracingSettings: TracingSettings, id: string, observed: ObservedType): SetTracingSettingsPayload {
        return {
            tracingSettings: {
                ...tracingSettings,
                deliveries: tracingSettings.deliveries.map(s => ({
                    ...s,
                    observed: (s.id === id ? observed : ObservedType.NONE)
                })),
                stations: tracingSettings.stations.map(s => ({
                    ...s,
                    observed: ObservedType.NONE
                }))
            }
        };
    }

    private resetScores(data: DataServiceData) {
        data.stations.forEach(s => {
            s.score = 0;
            s.commonLink = false;
        });
        data.deliveries.forEach(d => d.score = 0);
    }

    updateScores(data: DataServiceData) {
        this.resetScores(data);

        let nOutbreaks = 0;

        let maxScore = 0;

        data.stations.forEach(s => {
            if (s.outbreak && !s.contained && !s.invisible) {
                nOutbreaks++;
                this.visitedStats = {};
                this.visitedDels = {};
                this.updateStationScore(data, s.id, s.id);
            }
        });

        if (nOutbreaks !== 0) {
            data.stations.forEach(s => {
                s.score /= nOutbreaks;
                s.commonLink = s.score === 1.0;
                maxScore = Math.max(maxScore, s.score);
            });
            data.deliveries.forEach(d => {
                d.score /= nOutbreaks;
            });
        }

        data.tracingResult = { maxScore: maxScore };
    }

    private updateStationScore(data: DataServiceData, id: string, outbreakId: string) {
        const station = data.statMap[id];

        if (
            !this.visitedStats[station.id] &&
            !station.contained &&
            !station.invisible
        ) {
            this.visitedStats[station.id] = true;
            station.score++;

            for (const d of station.incoming) {
                this.updateDeliveryScore(data, d, outbreakId);
            }
        }
    }

    private updateDeliveryScore(data: DataServiceData, id: string, outbreakId: string) {
        const delivery = data.delMap[id];

        if (
            !this.visitedDels[delivery.id] &&
            !delivery.invisible &&
            !delivery.killContamination
        ) {
            this.visitedDels[delivery.id] = true;
            delivery.score++;

            const source = data.statMap[delivery.source];

            if (!source.killContamination) {
                if (!this.visitedStats[source.id]) {
                    this.visitedStats[source.id] = true;
                    source.score++;
                }

                this.getBackwardDeliveries(data, source, delivery).forEach(d =>
                    this.updateDeliveryScore(data, d, outbreakId)
                );
            }
        }
    }

    private showDeliveryForwardTraceInternal(data: DataServiceData, id: string) {
        const delivery = data.delMap[id];

        if (!delivery.forward && !delivery.invisible && !delivery.killContamination) {
            delivery.forward = true;

            const targetStation = data.statMap[delivery.target];

            targetStation.forward = true;
            this.getForwardDeliveries(data, targetStation, delivery).forEach(d =>
                this.showDeliveryForwardTraceInternal(data, d)
            );
        }
    }

    private showDeliveryBackwardTraceInternal(data: DataServiceData, id: string) {
        const delivery = data.delMap[id];

        if (!delivery.backward && !delivery.invisible) {
            delivery.backward = true;

            const sourceStation = data.statMap[delivery.source];

            sourceStation.backward = true;
            this.getBackwardDeliveries(data, sourceStation, delivery).forEach(d =>
                this.showDeliveryBackwardTraceInternal(data, d)
            );
        }
    }

    private getForwardDeliveries(data: DataServiceData, station: StationData, delivery: DeliveryData): string[] {
        if (station.crossContamination) {
            if (delivery.date != null) {
                const date = Utils.stringToDate(delivery.date);
                const forward: Set<string> = new Set(
                    station.connections.filter(c => c.source === delivery.id).map(c => c.target)
                );

                for (const id of station.outgoing) {
                    if (!forward.has(id)) {
                        const d = data.delMap[id];

                        if (d.date != null) {
                            if (date.getTime() <= Utils.stringToDate(d.date).getTime()) {
                                forward.add(id);
                            }
                        } else {
                            forward.add(id);
                        }
                    }
                }

                return Array.from(forward);
            } else {
                return station.outgoing;
            }
        } else {
            return station.connections.filter(c => c.source === delivery.id).map(c => c.target);
        }
    }

    private getBackwardDeliveries(data: DataServiceData, station: StationData, delivery: DeliveryData): string[] {
        if (station.killContamination) {
            return [];
        } else if (station.crossContamination) {
            if (delivery.date != null) {
                const date = Utils.stringToDate(delivery.date);
                const backward: Set<string> = new Set(station.connections.filter(c => c.target === delivery.id).map(c => c.source));

                for (const id of station.incoming) {
                    if (!backward.has(id)) {
                        const d = data.delMap[id];

                        if (d.date != null) {
                            if (date.getTime() >= Utils.stringToDate(d.date).getTime()) {
                                backward.add(id);
                            }
                        } else {
                            backward.add(id);
                        }
                    }
                }

                return Array.from(backward);
            } else {
                return station.incoming;
            }
        } else {
            return station.connections
        .filter(c => c.target === delivery.id)
        .map(c => c.source);
        }
    }

    private resetTrace(data: DataServiceData) {
        data.stations.forEach(s => {
            s.backward = false;
            s.forward = false;
        });
        data.deliveries.forEach(s => {
            s.backward = false;
            s.forward = false;
        });
    }

    updateTrace(data: DataServiceData) {
        this.resetTrace(data);

        data.stations.filter(s => s.observed !== ObservedType.NONE).forEach(station => {
            this.traceStation(
                data, station,
                station.observed === ObservedType.FULL || station.observed === ObservedType.FORWARD,
                station.observed === ObservedType.FULL || station.observed === ObservedType.BACKWARD
            );
        });
        data.deliveries.filter(d => d.observed !== ObservedType.NONE).forEach(delivery => {
            this.traceDelivery(
                data, delivery,
                delivery.observed === ObservedType.FULL || delivery.observed === ObservedType.FORWARD,
                delivery.observed === ObservedType.FULL || delivery.observed === ObservedType.BACKWARD
            );
        });
    }

    traceStation(data: DataServiceData, station: StationData, forward = true, backward = true) {
        if (forward && !station.killContamination) {
            data.getDelById(station.outgoing).filter(d => !d.invisible && !d.forward && !d.killContamination).forEach(delivery => {
                delivery.forward = true;
                this.traceDelivery(data, delivery, true, false);
            });
        }
        if (backward) {
            data.getDelById(station.incoming).filter(d => !d.invisible && !d.backward && !d.killContamination).forEach(delivery => {
                delivery.backward = true;
                this.traceDelivery(data, delivery, false, true);
            });
        }
    }

    traceDelivery(data: DataServiceData, delivery: DeliveryData, forward = true, backward = true) {
        if (forward && !delivery.killContamination) {
            const targetStation = data.statMap[delivery.target];
            targetStation.forward = true;
            if (!targetStation.killContamination) {
                data.getDelById(
                    this.getForwardDeliveries(data, targetStation, delivery)
                ).filter(forDel => !forDel.invisible && !forDel.forward).forEach(forDel => {
                    forDel.forward = true;
                    this.traceDelivery(data, forDel, true, false);
                });
            }
        }
        if (backward) {
            const sourceStation = data.statMap[delivery.source];
            if (!sourceStation.killContamination) {
                sourceStation.backward = true;
                data.getDelById(
                    this.getBackwardDeliveries(data, sourceStation, delivery)
                ).filter(backDel => !backDel.invisible && !backDel.backward).forEach(backDel => {
                    backDel.backward = true;
                    this.traceDelivery(data, backDel, false, true);
                });
            }
        }
    }

    haveStationSettingsChanged(oldSettings: TracingSettings, newSettings: TracingSettings): boolean {
        return !(
            oldSettings === newSettings ||
            oldSettings.stations === newSettings.stations
        );
    }

    haveDeliverySettingsChanged(oldSettings: TracingSettings, newSettings: TracingSettings): boolean {
        return !(
            oldSettings === newSettings ||
            oldSettings.deliveries === newSettings.deliveries
        );
    }

    haveSettingsChanged(oldSettings: TracingSettings, newSettings: TracingSettings): boolean {
        return !(
            oldSettings === newSettings ||
            oldSettings.stations === newSettings.stations ||
            oldSettings.deliveries === newSettings.deliveries
        );
    }

}
