import { Injectable } from '@angular/core';
import {
    SetTracingSettingsPayload,
    TracingSettings, ObservedType, DeliveryTracingSettings, StationTracingSettings,
    SelectedElements,
    ShowElementsTraceParams,
    ClearOutbreaksOptions,
    ElementTracingSettings,
    SetOutbreaksOptions,
    SetKillContaminationOptions
} from '../data.model';
import { getUpdatedObject, Utils } from '../util/non-ui-utils';

@Injectable({
    providedIn: 'root'
})
export class EditTracingSettingsService {

    private getNewElementsSettings<T extends ElementTracingSettings>(
        oldSettings: T[],
        updateFilterOrIds: ((x: T) => boolean) | string[],
        updateFun: (x: T) => T
    ): T[] {
        if (typeof updateFilterOrIds === 'function') {
            const updateFilter = updateFilterOrIds;
            return oldSettings.some(updateFilter) ?
                oldSettings.map(s => updateFilter(s) ? updateFun(s) : s) :
                oldSettings;
        } else {
            const idSet = new Set(updateFilterOrIds);
            return oldSettings.some(s => idSet.has(s.id)) ?
                oldSettings.map(s => idSet.has(s.id) ? updateFun(s) : s) :
                oldSettings;
        }
    }

    getClearOutbreaksPayload(tracingSettings: TracingSettings, options: ClearOutbreaksOptions): SetTracingSettingsPayload {
        return this.getMarkElementsAsOutbreakPayload(tracingSettings, {
            stationIds: options.clearStationOutbreaks ? tracingSettings.stations.filter(s => s.outbreak).map(s => s.id) : undefined,
            deliveryIds: options.clearDeliveryOutbreaks ? tracingSettings.deliveries.filter(d => d.outbreak).map(d => d.id) : undefined,
            outbreak: false
        });
    }

    getMarkElementsAsOutbreakPayload(
        tracingSettings: TracingSettings,
        options: SetOutbreaksOptions
    ): SetTracingSettingsPayload {
        const weight = options.outbreak ? 1 : 0;
        const updateFun = <T extends ElementTracingSettings>(x: T) => ({ ...x, outbreak: options.outbreak, weight: weight });

        const newStatSettings = options.stationIds ?
            this.getNewElementsSettings(tracingSettings.stations, options.stationIds, updateFun) :
            tracingSettings.stations;

        const newDelSettings = options.deliveryIds ?
            this.getNewElementsSettings(tracingSettings.deliveries, options.deliveryIds, updateFun) :
            tracingSettings.deliveries;

        return {
            tracingSettings: {
                ...tracingSettings,
                stations: newStatSettings,
                deliveries: newDelSettings
            }
        };
    }

    getClearCrossContaminationPayload(tracingSettings: TracingSettings): SetTracingSettingsPayload {
        return this.getSetStationCrossContPayload(tracingSettings, tracingSettings.stations.filter(s => s.crossContamination).map(s => s.id), false)
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

    getSetKillContaminationPayload(
        tracingSettings: TracingSettings,
        options: SetKillContaminationOptions
    ): SetTracingSettingsPayload {

        const newTracingSettings = { ...tracingSettings };

        if (options.stationIds) {
            const statIds = new Set(options.stationIds);
            const updateFilter = (s: StationTracingSettings) => statIds.has(s.id) && s.killContamination !== options.killContamination;
            const updateFun = (s: StationTracingSettings) => getUpdatedObject(s, {
                killContamination: options.killContamination,
                crossContamination: s.crossContamination && !options.killContamination
            });
            newTracingSettings.stations = this.getNewElementsSettings(tracingSettings.stations, updateFilter, updateFun);
        }
        if (options.deliveryIds) {
            const delIds = new Set(options.deliveryIds);
            const updateFilter = (s: DeliveryTracingSettings) => delIds.has(s.id) && s.killContamination !== options.killContamination;
            const updateFun = (s: DeliveryTracingSettings) => getUpdatedObject(s, { killContamination: options.killContamination });
            newTracingSettings.deliveries = this.getNewElementsSettings(tracingSettings.deliveries, updateFilter, updateFun);
        }

        return { tracingSettings: newTracingSettings };
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

    private getNewTracing<T extends (StationTracingSettings | DeliveryTracingSettings)>(
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

    resetObservedTypeForElements(tracingSettings: TracingSettings, elements: SelectedElements): TracingSettings | null {
        if (elements.stations.length > 0 || elements.deliveries.length > 0) {
            return {
                ...tracingSettings,
                stations: this.getNewTracing(tracingSettings.stations, elements.stations),
                deliveries: this.getNewTracing(tracingSettings.deliveries, elements.deliveries)
            };
        }
        return null;
    }

    private setElementsObservedType<T extends (StationTracingSettings | DeliveryTracingSettings)>(
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
