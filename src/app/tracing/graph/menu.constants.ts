interface ItemInfo {
    readonly displayName: string;
    readonly toolTip?: string;
}

export class MenuItemStrings {
    static readonly applyLayout: ItemInfo = {
        displayName: "Apply Layout",
    };

    static readonly clearTrace: ItemInfo = {
        displayName: "Clear Trace",
    };

    static readonly clearKillContaminations: ItemInfo = {
        displayName: "Clear Kill Contaminations",
    };

    static readonly clearKillContaminationStations: ItemInfo = {
        displayName: "Clear Kill Contamination Stations",
    };

    static readonly clearKillContaminationDeliveries: ItemInfo = {
        displayName: "Clear Kill Contamination Deliveries",
    };

    static readonly clearAllKillContaminations: ItemInfo = {
        displayName: "Clear All Kill Contaminations",
    };

    static readonly clearOutbreaks: ItemInfo = {
        displayName: "Clear Outbreaks",
    };

    static readonly clearOutbreakStations: ItemInfo = {
        displayName: "Clear Outbreak Stations",
    };

    static readonly clearOutbreakDeliveries: ItemInfo = {
        displayName: "Clear Outbreak Deliveries",
    };

    static readonly clearAllOutbreaks: ItemInfo = {
        displayName: "Clear All Outbreaks",
    };

    static readonly clearCrossContaminations: ItemInfo = {
        displayName: "Clear Cross Contaminations",
    };

    static readonly clearInvisibility: ItemInfo = {
        displayName: "Clear Invisibility",
    };

    static readonly clearInvisibleStations: ItemInfo = {
        displayName: "Clear Invisible Stations",
    };

    static readonly clearInvisibleDeliveries: ItemInfo = {
        displayName: "Clear Invisible Deliveries",
    };

    static readonly clearInvisibleElements: ItemInfo = {
        displayName: "Clear All",
    };

    static readonly collapseStations: ItemInfo = {
        displayName: "Collapse Stations",
    };

    static readonly uncollapseStations: ItemInfo = {
        displayName: "Uncollapse Stations",
    };

    static readonly uncollapseSources: ItemInfo = {
        displayName: "Uncollapse Sources",
    };

    static readonly uncollapseTargets: ItemInfo = {
        displayName: "Uncollapse Targets",
    };

    static readonly uncollapseSimpleChains: ItemInfo = {
        displayName: "Uncollapse Simple Chains",
    };

    static readonly uncollapseIsolatedClouds: ItemInfo = {
        displayName: "Uncollapse Isolated Clouds",
    };

    static readonly setTrace: ItemInfo = {
        displayName: "Set Trace",
    };

    static readonly forwardTrace: ItemInfo = {
        displayName: "Forward Trace",
    };

    static readonly backwardTrace: ItemInfo = {
        displayName: "Backward Trace",
    };

    static readonly fullTrace: ItemInfo = {
        displayName: "Full Trace",
    };

    static readonly showProperties: ItemInfo = {
        displayName: "Show Properties",
    };

    static readonly markOutbreaks: ItemInfo = {
        displayName: "Mark as Outbreak",
    };

    static readonly unmarkOutbreaks: ItemInfo = {
        displayName: "Unmark as Outbreak",
    };

    static readonly unsetStationCrossContamination: ItemInfo = {
        displayName: "Unset Cross Contamination",
    };

    static readonly setStationCrossContamination: ItemInfo = {
        displayName: "Set Cross Contamination",
    };

    static readonly unsetKillContamination: ItemInfo = {
        displayName: "Unset Kill Contamination",
    };

    static readonly setKillContamination: ItemInfo = {
        displayName: "Set Kill Contamination",
    };

    static readonly makeElementsInvisible: ItemInfo = {
        displayName: "Make Invisible",
    };

    static readonly mergeStations: ItemInfo = {
        displayName: "Merge Stations",
    };

    static readonly expandStations: ItemInfo = {
        displayName: "Expand",
    };

    static readonly collapseSources: ItemInfo = {
        displayName: "Collapse Sources",
        toolTip:
            "Collapse stations without incoming edges which have deliveries to the same station.",
    };

    static readonly collapseSourcesWeightOnly: ItemInfo = {
        displayName: "weight sensitive",
        // eslint-disable-next-line max-len
        toolTip:
            "Stations without incoming edges are collapsed if they send their delivieres to the same station and either their weights are all positive or all zero.",
    };

    static readonly collapseSourcesProductAndWeight: ItemInfo = {
        displayName: "product name and weight sensitive",
        // eslint-disable-next-line max-len
        toolTip:
            "Stations without incoming edges are collapsed if their outgoing delivieres go into the the same products of the same station and either their weights are all positive or all zero.",
    };

    static readonly collapseSourcesLotAndWeight: ItemInfo = {
        displayName: "lot and weight sensitive",
        // eslint-disable-next-line max-len
        toolTip:
            "Stations without incoming edges are collapsed if their outgoing delivieres go into the same lots of the same station and either their weights are all positive or all zero.",
    };

    static readonly collapseTargets: ItemInfo = {
        displayName: "Collapse Targets",
        toolTip:
            "Collapse stations without outgoing edges which receive their deliveries from the same station.",
    };

    static readonly collapseTargetsWeightOnly: ItemInfo = {
        displayName: "weight sensitive",
        // eslint-disable-next-line max-len
        toolTip:
            "Stations without outgoing edges are collapsed if they get their delivieres from the same station and either their weights are all positive or all zero.",
    };

    static readonly collapseTargetsProductAndWeight: ItemInfo = {
        displayName: "product name and weight sensitive",
        // eslint-disable-next-line max-len
        toolTip:
            "Stations without outgoing edges are collapsed if their incoming delivieres are all from the same product and either their weights are all positive or all zero.",
    };

    static readonly collapseTargetsLotAndWeight: ItemInfo = {
        displayName: "lot and weight sensitive",
        // eslint-disable-next-line max-len
        toolTip:
            "Stations without outgoing edges are collapsed if their incoming delivieres are all from the same lot and either their weights are all positive or all zero.",
    };

    static readonly collapseSimpleChains: ItemInfo = {
        displayName: "Collapse Simple Chains",
        toolTip:
            "Collapse stations without outgoing edges which receive their deliveries from the same station.",
    };

    static readonly collapseIsolatedClouds: ItemInfo = {
        displayName: "Collapse Isolated Clouds",
        toolTip:
            "Collapse stations from which a weighted station or delivery cannot be reached.",
    };
}
