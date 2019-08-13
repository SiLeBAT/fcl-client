import { DataService } from '../services/data.service';
import { GroupType, GroupData } from '../data.model';
import { IsolatedComponent, GroupingState, GroupingChange } from './model';
import * as _ from 'lodash';

export class IsolatedComponentCollapser {

    constructor(private dataService: DataService) {}

    getGroupingChange(
        state: GroupingState
    ): GroupingChange {

        const newGroups: GroupData[] = [];

        const nonBlockingGroupTypes: Set<GroupType> = new Set([
            GroupType.ISOLATED_GROUP,
            GroupType.SIMPLE_CHAIN,
            GroupType.SOURCE_GROUP,
            GroupType.TARGET_GROUP
        ]);

        const data = this.dataService.getData(state);

        const invisibleStationIds: Set<string> = new Set(
            data.stations.filter(s => s.invisible).map(s => s.id)
        );

        const blockedIds: Set<string> = new Set([
            ...[].concat(
                ...data.stations.filter(s =>
                    s.contains != null &&
                    s.contains.length > 0 &&
                    (s.groupType == null || !nonBlockingGroupTypes.has(s.groupType))
                ).map(s => s.contains)
            ),
            ...data.stations.filter(s =>
                s.contains != null &&
                s.contains.length > 0 &&
                (s.groupType == null || !nonBlockingGroupTypes.has(s.groupType))
            ).map(s => s.id)
        ]);

        const inNodes: Map<string, string[]> = new Map();
        const outNodes: Map<string, string[]> = new Map();

        for (const delivery of data.deliveries.filter(d => !d.invisible)) {
            const target: string = blockedIds.has(delivery.originalTarget) ? delivery.target : delivery.originalTarget;
            const source: string = blockedIds.has(delivery.originalSource) ? delivery.source : delivery.originalSource;

            if (
                source !== target &&
                !invisibleStationIds.has(target) &&
                !invisibleStationIds.has(source)
            ) {
                if (inNodes.has(target)) {
                    inNodes.get(target).push(source);
                } else {
                    inNodes.set(target, [source]);
                }
                if (outNodes.has(source)) {
                    outNodes.get(source).push(target);
                } else {
                    outNodes.set(source, [target]);
                }
            }
        }

        inNodes.forEach((idSources: string[], idTarget: string) => inNodes.set(idTarget, _.uniq(idSources)));
        outNodes.forEach((idTargets: string[], idSource: string) => outNodes.set(idSource, _.uniq(idTargets)));

        const notIsolatedStationIds: Set<string> = new Set(
            data.stations.filter(s => !s.invisible && s.outbreak).map(s => s.id).concat(
                _.uniq(data.deliveries.filter(d => !d.invisible && d.weight > 0).map(d =>
                    blockedIds.has(d.originalSource) ? d.source : d.originalSource
                ).filter(id => !invisibleStationIds.has(id)))
            )
        );

        let currentStations: string[] = Array.from(notIsolatedStationIds);
        while (currentStations.length > 0) {

            currentStations = _.uniq(
                [].concat(...currentStations.map(id => inNodes.get(id))).filter(id => id != null)
            ).filter(id => !notIsolatedStationIds.has(id));

            currentStations.forEach(id => notIsolatedStationIds.add(id));
        }

        const traverseStationIds: Set<string> = new Set(
            data.stations.filter(
                s =>
                !s.invisible &&
                (s.contains == null || s.contains.length === 0) &&
                !blockedIds.has(s.id) &&
                !notIsolatedStationIds.has(s.id)
            ).map(s => s.id)
        );

        const supportIds: Set<string> = new Set([
            ...Array.from(blockedIds),
            ...Array.from(notIsolatedStationIds)
        ]);
        const isolatedComponents: IsolatedComponent[] = [];

        for (const id of Array.from(traverseStationIds)) {
            const isolatedComponentIds: string[] = [];
            let componentSupportIds: string[] = [];
            this.traverseIsolatedComponent(
                id,
                isolatedComponentIds,
                componentSupportIds,
                traverseStationIds,
                supportIds,
                inNodes,
                outNodes
            );
            if (isolatedComponentIds.length > 0) {
                componentSupportIds = _.uniq(componentSupportIds);
                componentSupportIds.sort();
                isolatedComponents.push({
                    ids: isolatedComponentIds,
                    support: componentSupportIds
                });
            }
        }
        const isolatedComponentsComparator = (
          a: IsolatedComponent,
          b: IsolatedComponent
        ) => {
            if (a.support.length < b.support.length) {
                return -1;
            } else if (a.support.length > b.support.length) {
                return 1;
            }
            for (let i: number = a.support.length - 1; i >= 0; i--) {
                if (a.support[i] < b.support[i]) {
                    return -1;
                }
                if (a.support[i] > b.support[i]) {
                    return 1;
                }
            }
            return 0;
        };
        isolatedComponents.sort(isolatedComponentsComparator);

        if (isolatedComponents.length > 0) {

            let groupMemberIds: string[] = isolatedComponents[isolatedComponents.length - 1].ids;
            for (let iC: number = isolatedComponents.length - 2; iC >= 0; iC--) {

                if (isolatedComponentsComparator(isolatedComponents[iC], isolatedComponents[iC + 1]) !== 0) {
                    if (groupMemberIds.length > 1) {
                        newGroups.push({
                            id: 'IG:' + (newGroups.length + 1),
                            name: 'Isolated cloud ' + (newGroups.length + 1),
                            groupType: GroupType.ISOLATED_GROUP,
                            contains: groupMemberIds
                        });
                    }
                    groupMemberIds = isolatedComponents[iC].ids;
                } else {
                    groupMemberIds = groupMemberIds.concat(isolatedComponents[iC].ids);
                }
            }
            if (groupMemberIds.length > 1) {
                newGroups.push({
                    id: 'IG:' + (newGroups.length + 1),
                    name: 'Isolated cloud ' + (newGroups.length + 1),
                    groupType: GroupType.ISOLATED_GROUP,
                    contains: groupMemberIds
                });
            }
        }

        return {
            addGroups: newGroups,
            removeGroups: state.groupSettings.filter(g => g.groupType === GroupType.ISOLATED_GROUP)
        };
    }

    private traverseIsolatedComponent(
        id: string,
        componentIds: string[],
        componentSupportIds: string[],
        traverseIds: Set<string>,
        supportIds: Set<string>,
        inNodes: Map<string, string[]>,
        outNodes: Map<string, string[]>
    ) {
        if (traverseIds.has(id)) {
            traverseIds.delete(id);
            componentIds.push(id);

            const f = (a: string[]) => (a == null ? [] : a);
            for (const linkId of _.uniq(f(inNodes.get(id)).concat(f(outNodes.get(id))))) {
                if (supportIds.has(linkId)) {
                    componentSupportIds.push(linkId);
                } else {
                    this.traverseIsolatedComponent(
                        linkId,
                        componentIds,
                        componentSupportIds,
                        traverseIds,
                        supportIds,
                        inNodes,
                        outNodes
                    );
                }
            }
        }
    }
}
