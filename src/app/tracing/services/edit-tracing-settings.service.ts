import { Injectable } from '@angular/core';
import {
    SetTracingSettingsPayload,
    TracingSettings, ObservedType, DeliveryTracingSettings, StationTracingSettings,
    SelectedElements,
    ShowElementsTraceParams
} from '../data.model';
import { Utils } from '../util/non-ui-utils';

@Injectable({
    providedIn: 'root'
})
export class EditTracingSettingsService {

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

    private getNewTracing<T extends(StationTracingSettings | DeliveryTracingSettings)>(
        oldTracing: T[], newInvIds: string[]
    ): T[] {
        if (newInvIds.length === 0) {
            return oldTracing;
        } else {
            const idToIsInvMap = Utils.createSimpleStringSet(newInvIds);
            return oldTracing.map(t => ({
                ...t,
                observed: (idToIsInvMap[t.id] ? ObservedType.NONE : t.observed)
            }));
        }
    }

    resetObservedTypeForElements(tracingSettings: TracingSettings, elements: SelectedElements): TracingSettings {
        if (elements.stations.length > 0 || elements.deliveries.length > 0) {
            return {
                ...tracingSettings,
                stations: this.getNewTracing(tracingSettings.stations, elements.stations),
                deliveries: this.getNewTracing(tracingSettings.deliveries, elements.deliveries)
            };
        }
    }

    private setElementsObservedType<T extends(StationTracingSettings | DeliveryTracingSettings)>(
        elements: T[],
        ids: string[],
        observedType: ObservedType
    ): T[] {
        const idToIsTracedMap = Utils.createSimpleStringSet(ids);
        return elements.map((e: T) => ({
            ...e,
            observed: (idToIsTracedMap[e.id] ? observedType : ObservedType.NONE)
        }));
    }

    getShowElementsTracePayload(tracingSettings: TracingSettings, params: ShowElementsTraceParams): SetTracingSettingsPayload {
        return {
            tracingSettings: {
                ...tracingSettings,
                deliveries: this.setElementsObservedType(tracingSettings.deliveries, params.deliveryIds, params.observedType),
                stations: this.setElementsObservedType(tracingSettings.stations, params.stationIds, params.observedType)
            }
        };
    }

}
