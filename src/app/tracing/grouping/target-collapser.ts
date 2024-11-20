import { StationData, DeliveryData, GroupType, GroupMode } from "../data.model";
import { DataService } from "../services/data.service";
import { LinkGroup, GroupingState, GroupingChange } from "./model";
import * as _ from "lodash";
import { extractNewGroups } from "./shared";
import { concat } from "../util/non-ui-utils";

export class TargetCollapser {
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

        const targetStationCandidates: StationData[] = data.stations.filter(
            (s) =>
                !s.invisible &&
                (s.contains === null || s.contains.length === 0) &&
                s.incoming &&
                s.incoming.length > 0 &&
                (!s.contained || ignoreMemberIdSet.has(s.id)),
        );

        const sourceIdToLinkGroupMap: Map<string, LinkGroup> = new Map();
        for (const target of targetStationCandidates) {
            if (
                data.getDelById(target.outgoing).filter((d) => !d.invisible)
                    .length === 0
            ) {
                const targetInDeliveries: DeliveryData[] = data
                    .getDelById(target.incoming)
                    .filter((d) => !d.invisible);
                const sourceStations: StationData[] = data
                    .getStatById(
                        _.uniq(targetInDeliveries.map((d) => d.originalSource)),
                    )
                    .filter((s) => !s.invisible);

                if (sourceStations.length === 1) {
                    let sourceKeys: string[];
                    if (groupMode === GroupMode.WEIGHT_ONLY) {
                        sourceKeys = ["W>0:" + (target.outbreak ? "1" : "0")];
                    } else {
                        const sourceOutDeliveries = targetInDeliveries.filter(
                            (d) => d.originalSource === sourceStations[0].id,
                        );
                        if (sourceOutDeliveries.length === 0) {
                            sourceKeys = [
                                "W>0:" + (target.outbreak ? "1" : "0"),
                            ];
                        } else {
                            switch (groupMode) {
                                case GroupMode.PRODUCT_AND_WEIGHT:
                                    sourceKeys = _.uniq(
                                        sourceOutDeliveries.map(
                                            (d) =>
                                                "W>0:" +
                                                (target.outbreak ? "1" : "0") +
                                                "_P:" +
                                                (d.name
                                                    ? "PN:" + d.name
                                                    : "DID:" + d.id),
                                        ),
                                    ).sort();
                                    break;
                                case GroupMode.LOT_AND_WEIGHT:
                                    sourceKeys = _.uniq(
                                        sourceOutDeliveries.map(
                                            (d) =>
                                                "W>0:" +
                                                (target.outbreak ? "1" : "0") +
                                                "_L:" +
                                                (d.name && d.lot
                                                    ? "PN:" +
                                                      d.name +
                                                      "LN:" +
                                                      d.lot
                                                    : "DID:" + d.id),
                                        ),
                                    ).sort();
                                    break;
                                default:
                                    // unkown mode
                                    return;
                            }
                        }
                    }

                    if (!sourceIdToLinkGroupMap.has(sourceStations[0].id)) {
                        sourceIdToLinkGroupMap.set(sourceStations[0].id, {
                            linkStation: sourceStations[0],
                            linkedStations: [],
                        });
                    }

                    sourceIdToLinkGroupMap
                        .get(sourceStations[0].id)!
                        .linkedStations.push({
                            linkedStation: target,
                            linkKeys: sourceKeys,
                        });
                }
            }
        }

        return {
            addGroups: extractNewGroups(
                sourceIdToLinkGroupMap,
                (linkedGroup, newGroupNumber) => {
                    const idAndName =
                        "TG:" + linkedGroup.linkStation.name + " targets";
                    return {
                        // preferred variants, but delayed until desktop can handle it
                        // id: 'TG:' + linkedGroup.linkStation.id + (newGroupNumber === 1 ? '' : '_' + newGroupNumber),
                        // name: linkedGroup.linkStation.name + ' targets',
                        id: idAndName,
                        name: idAndName,
                        groupType: GroupType.TARGET_GROUP,
                    };
                },
            ),
            removeGroups: oldGroups,
        };
    }
}
