import { DataService } from '../services/data.service';
import { GroupType, GroupData } from '../data.model';
import * as _ from 'lodash';
import { GroupingState, GroupingChange } from './model';

export class SimpleChainCollapser {

    constructor(private dataService: DataService) {}

    getGroupingChange(
        state: GroupingState
    ): GroupingChange {

        const newChains: GroupData[] = [];

        const data = this.dataService.getData(state);

        const invisibleStationIds: Set<string> = new Set(
            data.stations.filter(s => s.invisible).map(s => s.id)
        );
        const blockedIds: Set<string> = new Set([].concat(
            [].concat(
                ...state.groupSettings.filter(g => g.groupType !== GroupType.SIMPLE_CHAIN).map(g => g.contains)
            ),
            invisibleStationIds
        ));

        const inNodes: Map<string, string[]> = new Map();
        const outNodes: Map<string, string[]> = new Map();

        for (const delivery of data.deliveries.filter(d => !d.invisible)) {
            if (
                delivery.originalSource !== delivery.originalTarget &&
                !invisibleStationIds.has(delivery.originalTarget) &&
                !invisibleStationIds.has(delivery.originalSource)
            ) {
                if (!blockedIds.has(delivery.originalTarget)) {
                    if (inNodes.has(delivery.originalTarget)) {
                        inNodes.get(delivery.originalTarget).push(delivery.originalSource);
                    } else {
                        inNodes.set(delivery.originalTarget, [delivery.originalSource]);
                    }
                }
                if (!blockedIds.has(delivery.originalSource)) {
                    if (outNodes.has(delivery.originalSource)) {
                        outNodes.get(delivery.originalSource).push(delivery.originalTarget);
                    } else {
                        outNodes.set(delivery.originalSource, [delivery.originalTarget]);
                    }
                }
            }
        }

        inNodes.forEach((idSources: string[], idTarget: string) =>
            inNodes.set(idTarget, _.uniq(idSources))
        );
        outNodes.forEach((idTargets: string[], idSource: string) =>
            outNodes.set(idSource, _.uniq(idTargets))
        );

        const ignoredIds: Set<string> = new Set(Array.from(blockedIds));

        for (const idTarget of Array.from(inNodes.keys())) {
            if (inNodes.get(idTarget).length > 1) {
                ignoredIds.add(idTarget);
            }
        }

        for (const idSource of Array.from(outNodes.keys())) {
            if (outNodes.get(idSource).length > 1) {
                ignoredIds.add(idSource);
            }
        }

        for (const id of Array.from(ignoredIds)) {
            if (inNodes.has(id)) {
                inNodes.delete(id);
            }
            if (outNodes.has(id)) {
                outNodes.delete(id);
            }
        }

        const nonStartNodeIds: Set<string> = new Set(
            Array.from(inNodes.keys()).filter(idTarget =>
                inNodes.get(idTarget).filter(idSource => !ignoredIds.has(idSource)).length > 0
            )
        );
        const startNodes: string[] = Array.from(outNodes.keys()).filter(id => !nonStartNodeIds.has(id));

        for (const startId of startNodes) {
            const newChain: string[] = [startId];
            let currentId: string = startId;
            while (outNodes.has(currentId) && outNodes.get(currentId).length > 0) {
                currentId = outNodes.get(currentId)[0];
                if (ignoredIds.has(currentId)) {
                    break;
                }
                newChain.push(currentId);
            }
            if (newChain.length > 1) {
                const firstId = newChain[0];
                const lastId = newChain[newChain.length - 1];
                const idAndName = 'SC:' + data.statMap[firstId].name + ' -> ' + data.statMap[lastId].name;
                newChains.push({
                    // preferred variants, but delayed until desktop can handle it
                    // id: 'SC:' + firstId + '->' + lastId,
                    // name: data.statMap[firstId].name + ' -> ' + data.statMap[lastId].name,
                    id: idAndName,
                    name: idAndName,
                    contains: newChain,
                    groupType: GroupType.SIMPLE_CHAIN
                });
            }
        }

        return {
            addGroups: newChains,
            removeGroups: state.groupSettings.filter(g => g.groupType === GroupType.SIMPLE_CHAIN)
        };
    }
}
