import { StationData, DeliveryData, GroupMode, GroupType } from "../data.model";
import { DataService } from "../services/data.service";
import { LinkGroup, GroupingState, GroupingChange } from "./model";
import * as _ from "lodash";
import { extractNewGroups } from "./shared";
import { concat } from "../util/non-ui-utils";

export class SourceCollapser {
    constructor(private dataService: DataService) {}

    getGroupingChange(
        state: GroupingState,
        groupMode: GroupMode,
    ): GroupingChange | undefined {
        const oldGroups = state.groupSettings.filter(
            (g) => g.groupType === GroupType.SOURCE_GROUP,
        );

        const ignoreMemberIdSet = new Set<string>(
            concat(...oldGroups.map((g) => g.contains)),
        );

        const data = this.dataService.getData(state);
        const sourceStationCandidates: StationData[] = data.stations.filter(
            (s) =>
                !s.invisible &&
                (!s.contains || s.contains.length === 0) &&
                s.outgoing &&
                s.outgoing.length > 0 &&
                (!s.contained || ignoreMemberIdSet.has(s.id)),
        );

        const targetIdToLinkGroupMap: Map<string, LinkGroup> = new Map();
        for (const source of sourceStationCandidates) {
            if (
                data.getDelById(source.incoming).filter((d) => !d.invisible)
                    .length === 0
            ) {
                const sourceOutDeliveries: DeliveryData[] = data
                    .getDelById(source.outgoing)
                    .filter((d) => !d.invisible);
                const targetStations: StationData[] = data
                    .getStatById(
                        _.uniq(
                            sourceOutDeliveries.map((d) => d.originalTarget),
                        ),
                    )
                    .filter((s) => !s.invisible);

                if (targetStations.length === 1) {
                    let targetKeys: string[];
                    if (groupMode === GroupMode.WEIGHT_ONLY) {
                        targetKeys = [source.outbreak ? "1" : "0"];
                    } else {
                        const targetInDeliveryIdSet: Set<string> = new Set(
                            sourceOutDeliveries
                                .filter(
                                    (d) =>
                                        d.originalTarget ===
                                        targetStations[0].id,
                                )
                                .map((d) => d.id),
                        );
                        const targetOutDeliveries: DeliveryData[] = data
                            .getDelById(
                                targetStations[0].connections
                                    .filter((c) =>
                                        targetInDeliveryIdSet.has(c.source),
                                    )
                                    .map((c) => c.target),
                            )
                            .filter((d) => !d.invisible);

                        if (targetOutDeliveries.length === 0) {
                            targetKeys = [
                                "W>0:" + (source.outbreak ? "1" : "0"),
                            ];
                        } else {
                            switch (groupMode) {
                                case GroupMode.PRODUCT_AND_WEIGHT:
                                    targetKeys = _.uniq(
                                        targetOutDeliveries.map(
                                            (d) =>
                                                "W>0:" +
                                                    (source.outbreak
                                                        ? "1"
                                                        : "0") +
                                                    "_P:" +
                                                    d.name || d.id,
                                        ),
                                    ).sort();
                                    break;
                                case GroupMode.LOT_AND_WEIGHT:
                                    targetKeys = _.uniq(
                                        targetOutDeliveries.map(
                                            (d) =>
                                                "W>0:" +
                                                (source.outbreak ? "1" : "0") +
                                                "_L:" +
                                                d.lotKey,
                                        ),
                                    ).sort();
                                    break;
                                default:
                                    // unkown mode
                                    return;
                            }
                        }
                    }

                    if (!targetIdToLinkGroupMap.has(targetStations[0].id)) {
                        targetIdToLinkGroupMap.set(targetStations[0].id, {
                            linkStation: targetStations[0],
                            linkedStations: [],
                        });
                    }

                    targetIdToLinkGroupMap
                        .get(targetStations[0].id)!
                        .linkedStations.push({
                            linkedStation: source,
                            linkKeys: targetKeys,
                        });
                }
            }
        }

        return {
            addGroups: extractNewGroups(
                targetIdToLinkGroupMap,
                (linkGroup, newGroupNumber) => {
                    const idAndName =
                        "SG:" + linkGroup.linkStation.name + " sources";
                    return {
                        // preferred variants, but delayed until desktop can handle it
                        // id: 'SG:' + linkGroup.linkStation.id + (newGroupNumber === 1 ? '' : '_' + newGroupNumber),
                        // name: linkGroup.linkStation.name + ' sources',
                        id: idAndName,
                        name: idAndName,
                        groupType: GroupType.SOURCE_GROUP,
                    };
                },
            ),
            removeGroups: oldGroups,
        };
    }
}
