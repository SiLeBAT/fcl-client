import { Injectable } from "@angular/core";
import {
    ObservedType,
    StationData,
    StationId,
    DeliveryId,
    DataServiceData,
    DeliveryData,
} from "../data.model";
import { MenuItemData } from "../shared/menu-item-data.model";
import { MenuItemStrings } from "../shared/menu.constants";
import {
    MarkElementsAsOutbreakMSA,
    SetStationCrossContaminationMSA,
    SetKillContaminationMSA,
    ShowDeliveryPropertiesMSA,
    ShowStationPropertiesMSA,
    SetInvisibilityMSA,
    SetObservedTypeMSA,
} from "../tracing.actions";
import {
    ExpandStationsMSA,
    MergeStationsMSA,
} from "../grouping/grouping.actions";

import { concat } from "../util/non-ui-utils";

interface ContextElements {
    stationIds: StationId[];
    deliveryIds: DeliveryId[];
    stations: StationData[];
    deliveries: DeliveryData[];
    stationCount: number;
    deliveryCount: number;
    elementCount: number;
    nonMemberStations: StationData[];
    nonMemberStationIds: string[];
    nonMemberStationCount: number;
    updatableElementCount: number;
    visibleStationCount: number;
    visibleElementCount: number;
    visibleStations: StationData[];
    visibleStationIds: StationId[];
    visibleDeliveryIds: DeliveryId[];
}

@Injectable({
    providedIn: "root",
})
export class TracingContextMenuService {
    private createMakeInvisibleItemData(
        contextElements: ContextElements,
        dataServiceData: DataServiceData,
    ): MenuItemData {
        const updatableStations = contextElements.nonMemberStations;
        const updatableStationIds = contextElements.nonMemberStationIds;
        let updatableDeliveries = contextElements.deliveries;

        const useMakeInvisibleOption = contextElements.visibleElementCount > 0;

        if (!useMakeInvisibleOption) {
            // make visible
            const allVisibleStationIds = dataServiceData.stations
                .filter((s) => !s.invisible)
                .map((s) => s.id);
            const willBeVisibleStationIdSet = new Set([
                ...allVisibleStationIds,
                ...updatableStationIds,
            ]);
            updatableDeliveries = updatableDeliveries.filter(
                (d) =>
                    willBeVisibleStationIdSet.has(d.source) &&
                    willBeVisibleStationIdSet.has(d.target),
            );
        }

        const updatableElementCount =
            updatableStations.length + updatableDeliveries.length;

        return {
            ...(useMakeInvisibleOption
                ? MenuItemStrings.makeElementsInvisible
                : MenuItemStrings.clearInvisibility),
            disabled: updatableElementCount === 0,
            action: new SetInvisibilityMSA({
                stationIds: updatableStationIds,
                deliveryIds: updatableDeliveries.map((d) => d.id),
                invisible: useMakeInvisibleOption,
            }),
        };
    }

    private createMarkAsOutbreakItemData(
        contextElements: ContextElements,
    ): MenuItemData {
        const stationsAreOutbreaks = contextElements.nonMemberStations.every(
            (s) => s.outbreak,
        );
        const deliveriesAreOutbreaks = contextElements.deliveries.every(
            (d) => d.outbreak,
        );
        const allElementsAreOutbreaks =
            stationsAreOutbreaks && deliveriesAreOutbreaks;

        const useMarkAsOutbreakOption =
            !allElementsAreOutbreaks ||
            contextElements.updatableElementCount === 0;
        return {
            ...(!useMarkAsOutbreakOption
                ? MenuItemStrings.unmarkOutbreaks
                : MenuItemStrings.markOutbreaks),
            disabled: contextElements.updatableElementCount === 0,
            action: new MarkElementsAsOutbreakMSA({
                stationIds: contextElements.nonMemberStationIds,
                deliveryIds: contextElements.deliveryIds,
                outbreak: useMarkAsOutbreakOption,
            }),
        };
    }

    private createSetCrossContaminationItemData(
        contextElements: ContextElements,
    ): MenuItemData {
        const allCrossContaminationStations =
            contextElements.nonMemberStations.every(
                (s) => s.crossContamination,
            );
        const useSetCrossContaminationOption =
            !allCrossContaminationStations ||
            contextElements.nonMemberStationCount === 0;
        return {
            ...(!useSetCrossContaminationOption
                ? MenuItemStrings.unsetStationCrossContamination
                : MenuItemStrings.setStationCrossContamination),
            disabled: contextElements.nonMemberStationCount === 0,
            action: new SetStationCrossContaminationMSA({
                stationIds: contextElements.nonMemberStationIds,
                crossContamination: useSetCrossContaminationOption,
            }),
        };
    }

    private createSetKillContaminationItemData(
        contextElements: ContextElements,
    ): MenuItemData {
        const allContextStationsHaveKillCon =
            contextElements.nonMemberStations.every((s) => s.killContamination);
        const allContextDeliveriesHaveKillCon =
            contextElements.deliveries.every((d) => d.killContamination);
        const allContextElementsHaveKillCon =
            allContextStationsHaveKillCon && allContextDeliveriesHaveKillCon;

        const useSetKillContaminationOption =
            !allContextStationsHaveKillCon ||
            !allContextDeliveriesHaveKillCon ||
            contextElements.updatableElementCount === 0;
        return {
            ...(!useSetKillContaminationOption
                ? MenuItemStrings.unsetKillContamination
                : MenuItemStrings.setKillContamination),
            disabled: contextElements.updatableElementCount === 0,
            action: new SetKillContaminationMSA({
                stationIds: contextElements.nonMemberStationIds,
                deliveryIds: contextElements.deliveryIds,
                killContamination: useSetKillContaminationOption,
            }),
        };
    }

    private createMergeStationsItemData(
        contextElements: ContextElements,
    ): MenuItemData {
        const mergableStations = contextElements.visibleStations;
        return {
            ...MenuItemStrings.mergeStations,
            disabled: mergableStations.length < 2,
            action: new MergeStationsMSA({
                memberIds: mergableStations.map((s) => s.id),
            }),
        };
    }

    private createExpandStationsItemData(
        contextElements: ContextElements,
    ): MenuItemData {
        const expandableStations = contextElements.visibleStations.filter(
            (s) => s.isMeta,
        );

        return {
            ...MenuItemStrings.expandStations,
            disabled:
                expandableStations.length === 0 ||
                contextElements.visibleStationCount > expandableStations.length,
            action: new ExpandStationsMSA({
                stationIds: expandableStations.map((s) => s.id),
            }),
        };
    }

    createStationOptions(
        elementIds: {
            stationIds: StationId[];
            deliveryIds?: DeliveryId[];
        },
        dataServiceData: DataServiceData,
    ): MenuItemData[] {
        const contextElements = this.getFullContext(
            elementIds,
            dataServiceData,
        );

        return concat([
            this.createShowStationPropertiesItemData(
                contextElements.stationIds,
            ),
            this.createSetObservedTypeItemData(contextElements),
            this.createMarkAsOutbreakItemData(contextElements),
            this.createSetCrossContaminationItemData(contextElements),
            this.createSetKillContaminationItemData(contextElements),
            this.createMakeInvisibleItemData(contextElements, dataServiceData),
            this.createMergeStationsItemData(contextElements),
            this.createExpandStationsItemData(contextElements),
        ]);
    }

    private getFullContext(
        context: { stationIds?: StationId[]; deliveryIds?: DeliveryId[] },
        dataServiceData: DataServiceData,
    ): ContextElements {
        const stationIds = context.stationIds ?? [];
        const deliveryIds = context.deliveryIds ?? [];
        const stations = dataServiceData.getStatById(stationIds);
        const deliveries = dataServiceData.getDelById(deliveryIds);
        const visStations = stations.filter(
            (s) => !s.invisible && !s.contained,
        );
        const visDeliveries = deliveries.filter((d) => !d.invisible);
        const nonMemberStations = stations.filter((s) => !s.contained);
        return {
            stationIds: stationIds,
            deliveryIds: deliveryIds,
            stations: stations,
            deliveries: deliveries,
            stationCount: stations.length,
            deliveryCount: deliveries.length,
            elementCount: stations.length + deliveries.length,
            nonMemberStations: nonMemberStations,
            nonMemberStationIds: nonMemberStations.map((s) => s.id),
            nonMemberStationCount: nonMemberStations.length,
            updatableElementCount: nonMemberStations.length + deliveries.length,
            visibleStations: visStations,
            visibleStationIds: visStations.map((s) => s.id),
            visibleDeliveryIds: visDeliveries.map((d) => d.id),
            visibleStationCount: visStations.length,
            visibleElementCount: visStations.length + visDeliveries.length,
        };
    }

    createDeliveryOptions(
        elementIds: {
            stationIds?: StationId[];
            deliveryIds: DeliveryId[];
        },
        dataServiceData: DataServiceData,
    ): MenuItemData[] {
        const contextElements = this.getFullContext(
            elementIds,
            dataServiceData,
        );
        return [
            this.createShowDeliveryPropertiesItemData(elementIds.deliveryIds),
            this.createSetObservedTypeItemData(contextElements),
            this.createMarkAsOutbreakItemData(contextElements),
            this.createSetKillContaminationItemData(contextElements),
            this.createMakeInvisibleItemData(contextElements, dataServiceData),
        ];
    }

    private createShowStationPropertiesItemData(
        stationIds: StationId[],
    ): MenuItemData {
        return {
            ...MenuItemStrings.showProperties,
            disabled: stationIds.length !== 1,
            action: new ShowStationPropertiesMSA({
                stationId: stationIds[0],
            }),
        };
    }

    private createShowDeliveryPropertiesItemData(
        deliveryIds: DeliveryId[],
    ): MenuItemData {
        return {
            ...MenuItemStrings.showProperties,
            action: new ShowDeliveryPropertiesMSA({
                deliveryIds: deliveryIds,
            }),
        };
    }

    private createSetObservedTypeItemData(
        contextElements: ContextElements,
    ): MenuItemData {
        const getAction = (type: ObservedType) =>
            new SetObservedTypeMSA({
                stationIds: contextElements.visibleStationIds,
                deliveryIds: contextElements.visibleDeliveryIds,
                observedType: type,
            });

        return {
            ...MenuItemStrings.setTrace,
            disabled: contextElements.visibleElementCount === 0,
            children: [
                {
                    ...MenuItemStrings.forwardTrace,
                    action:
                        getAction === null
                            ? undefined
                            : getAction(ObservedType.FORWARD),
                },
                {
                    ...MenuItemStrings.backwardTrace,
                    action:
                        getAction === null
                            ? undefined
                            : getAction(ObservedType.BACKWARD),
                },
                {
                    ...MenuItemStrings.fullTrace,
                    action:
                        getAction === null
                            ? undefined
                            : getAction(ObservedType.FULL),
                },
            ],
        };
    }
}
