import { Injectable } from '@angular/core';
import {
  Connection,
  DeliveryData,
  FclElements,
  ObservedType,
  Position,
  StationData,
  GroupMode,
  GroupType
} from '../util/datatypes';
import { Utils } from '../util/utils';
import * as _ from 'lodash';
import { initChangeDetectorIfExisting } from '@angular/core/src/render3/instructions';

interface LinkGroup {
    linkStation: StationData;
    linkedStations: {
        linkedStation: StationData;
        linkKeys: string[];
    }[];
}
type GroupNamingFun = (linkGroup: LinkGroup, groupNumber: number) => string;
interface IsolatedComponent {
    ids: string[];
    support: string[];
}
class SimpleGraph {
    private incomings: number[][];
    private out: number[][];
    private count: number;

    constructor() {}
    isolateGraphs(): number[][] {
        const marked: boolean[] = [];
        const result: number[][] = [];
        for (let i = this.count - 1; i >= 0; i--) {
            marked[i] = false;
        }
        for (let i = this.count - 1; i >= 0; i--) {
            if (!marked[i]) {
                result.push(this.dfs(i, marked));
            }
        }
        return result;
    }
    dfs(index: number, marked: boolean[]): number[] {
        let result: number[] = [];
        marked[index] = true;
        for (const i of this.incomings[index]) {
            if (!marked[i]) {
                result = result.concat(this.dfs(i, marked));
            }
        }
        for (const i of this.out[index]) {
            if (!marked[i]) {
                result = result.concat(this.dfs(i, marked));
            }
        }
        return result;
    }
}
@Injectable({
    providedIn: 'root'
})
export class TracingService {
    private data: FclElements;
    private stationsById: Map<string, StationData> = new Map();
    private deliveriesById: Map<string, DeliveryData> = new Map();
    private maxScore: number;

    private visited: Set<string> = new Set();

    constructor() {}

    init(data: FclElements) {
        this.data = data;
        this.stationsById.clear();
        this.deliveriesById.clear();
        this.maxScore = 0;

        for (const s of data.stations) {
            this.stationsById.set(s.id, s);
            this.maxScore = Math.max(this.maxScore, s.score);
        }

        for (const d of data.deliveries) {
            this.deliveriesById.set(d.id, d);
        }

        this.updateScores();
    }

    getMaxScore() {
        return this.maxScore;
    }

    getStationsById(ids: string[]): StationData[] {
        return ids.map(id => this.stationsById.get(id));
    }

    getDeliveriesById(ids: string[]): DeliveryData[] {
        return ids.map(id => this.deliveriesById.get(id));
    }

    mergeStations(ids: string[], name: string) {
        this.mergeStationsInternal(ids, name, null, null);

        this.updateTrace();
        this.updateScores();
    }

    mergeStationsInternal(
    ids: string[],
    name: string,
    groupType: GroupType,
    position: Position
  ) {
        let allIds: string[] = [];

        for (const id of ids) {
            const station = this.stationsById.get(id);

            if (station.contains != null && station.contains.length > 0) {
                allIds = allIds.concat(station.contains);
                this.expandStationsInternal([id]);
            } else {
                allIds.push(id);
            }
        }

        let metaId;

        for (let i = 1; ; i++) {
            if (
        !this.stationsById.has(i.toString()) &&
        !this.deliveriesById.has(i.toString())
      ) {
                metaId = i.toString();
                break;
            }
        }

        const metaStation: StationData = {
            id: metaId,
            name: name,
            lat: null,
            lon: null,
            incoming: [],
            outgoing: [],
            connections: [],
            invisible: false,
            contained: false,
            contains: allIds,
            selected: true,
            observed: ObservedType.NONE,
            forward: false,
            backward: false,
            outbreak: false,
            crossContamination: false,
            killContamination: false,
            weight: 0,
            score: 0,
            commonLink: false,
            groupType: groupType,
            position: null,
            positionRelativeTo: null,
            properties: []
        };

        let coordinates: Position[] = [];

        for (const id of allIds) {
            const station = this.stationsById.get(id);

            station.contained = true;
            station.observed = ObservedType.NONE;

            metaStation.incoming = metaStation.incoming.concat(station.incoming);
            metaStation.outgoing = metaStation.outgoing.concat(station.outgoing);
            metaStation.connections = metaStation.connections.concat(
        station.connections
      );

            station.incoming.forEach(
        d => (this.deliveriesById.get(d).target = metaId)
      );
            station.outgoing.forEach(
        d => (this.deliveriesById.get(d).source = metaId)
      );

            if (coordinates != null) {
                if (station.lat != null && station.lon != null) {
                    coordinates.push({ x: station.lon, y: station.lat });
                } else {
                    coordinates = null;
                }
            }
        }

        if (coordinates != null) {
            const c = Utils.getCenter(coordinates);

            metaStation.lat = c.y;
            metaStation.lon = c.x;
        }

        this.stationsById.set(metaId, metaStation);
        this.data.stations.push(metaStation);
    }

    getElapsedTime(dateStart: Date, dateEnd: Date): number {
        return this.getDateNumber(dateEnd) - this.getDateNumber(dateStart);
    }

    getDateNumber(date: Date): number {
        return (
      date.getMilliseconds() +
      date.getSeconds() * 1000 +
      date.getMinutes() * 60000 +
      date.getHours() * 3600000
        );
    }

    collapseSourceStations(groupMode: GroupMode) {
        let dateStart: Date = new Date();
        const oldGroups = this.getOldGroups(GroupType.SOURCE_GROUP);
        const newGroups: Map<string, string[]> = this.getNewSourceGroups(
      groupMode,
      oldGroups
    );
        const newToOldGroupMap: Map<string, string> = this.mapNewGroupsToOldGroups(
      newGroups,
      oldGroups
    );
        const oldPositions: Map<string, Position> = this.getPositionOfStations(
      Array.from(newToOldGroupMap.values())
    );

        this.expandStationsInternal(Array.from(oldGroups.keys()));

        newGroups.forEach((memberIds: string[], groupId: string) => {
            this.mergeStationsInternal(
        newGroups.get(groupId),
        groupId,
        GroupType.SOURCE_GROUP,
        oldPositions.get(newToOldGroupMap.get(groupId))
      );
        });
        this.updateTrace();
        dateStart = new Date();
        this.updateScores();
    }

    uncollapseSourceStations() {
        const oldGroups = this.getOldGroups(GroupType.SOURCE_GROUP);

        this.expandStationsInternal(Array.from(oldGroups.keys()));

        this.updateTrace();
        this.updateScores();
    }

    collapseTargetStations(groupMode: GroupMode) {
        const oldGroups = this.getOldGroups(GroupType.TARGET_GROUP);
        const newGroups: Map<string, string[]> = this.getNewTargetGroups(
      groupMode,
      oldGroups
    );
        const newToOldGroupMap: Map<string, string> = this.mapNewGroupsToOldGroups(
      newGroups,
      oldGroups
    );
        const oldPositions: Map<string, Position> = this.getPositionOfStations(
      Array.from(newToOldGroupMap.values())
    );
        this.expandStationsInternal(Array.from(oldGroups.keys()));

        newGroups.forEach((memberIds: string[], groupId: string) => {
            this.mergeStationsInternal(
        memberIds,
        groupId,
        GroupType.TARGET_GROUP,
        oldPositions.get(newToOldGroupMap.get(groupId))
      );
        });

        this.updateTrace();
        this.updateScores();
    }

    uncollapseTargetStations() {
        const oldGroups = this.getOldGroups(GroupType.TARGET_GROUP);

        this.expandStationsInternal(Array.from(oldGroups.keys()));

        this.updateTrace();
        this.updateScores();
    }

    collapseIsolatedClouds() {
        const oldGroups = this.getOldGroups(GroupType.ISOLATED_GROUP);
        const newGroups: Map<string, string[]> = this.getNewIsolatedGroups(
      oldGroups
    );

    // this.expandStationsInternal(Array.from(oldGroups.keys()));
    // const tmp: string[] = this.getContainingStationsIds([].concat(...Array.from(newGroups.values())));
    // const tmpn: string[] = this.getStationsById(tmp).map(s=>s.name);
        this.expandStationsInternal(
      this.getContainingStationsIds(
        [].concat(...Array.from(newGroups.values()))
      )
    );

        newGroups.forEach((memberIds: string[], groupId: string) =>
      this.mergeStationsInternal(
        memberIds,
        groupId,
        GroupType.ISOLATED_GROUP,
        null
      )
    );

        this.updateTrace();
        this.updateScores();
    }

    uncollapseIsolatedClouds() {
        const oldGroups = this.getOldGroups(GroupType.ISOLATED_GROUP);
        this.expandStationsInternal(Array.from(oldGroups.keys()));

        this.updateTrace();
        this.updateScores();
    }

    private getContainingStationsIds(memberIds: string[]): string[] {
        const idSet: Set<string> = new Set(memberIds);
        return this.data.stations
      .filter(s => s.contains != null && s.contains.some(mId => idSet.has(mId)))
      .map(s => s.id);
    }

    collapseSimpleChains() {
        const oldGroups = this.getOldGroups(GroupType.SIMPLE_CHAIN);
        const newGroups: Map<string, string[]> = this.getNewSimpleChains();

        this.expandStationsInternal(Array.from(oldGroups.keys()));

        newGroups.forEach((memberIds: string[], chainId: string) => {
            this.mergeStationsInternal(
        memberIds,
        chainId,
        GroupType.SIMPLE_CHAIN,
        null
      );
        });

        this.updateTrace();
        this.updateScores();
    }

    uncollapseSimpleChains() {
        const oldGroups = this.getOldGroups(GroupType.SIMPLE_CHAIN);

        this.expandStationsInternal(Array.from(oldGroups.keys()));

        this.updateTrace();
        this.updateScores();
    }

    private getNewSimpleChains(): Map<string, string[]> {
        const newChains: Map<string, string[]> = new Map();

        const invisibleStationIds: Set<string> = new Set(
      this.data.stations.filter(s => s.invisible).map(s => s.id)
    );
        const blockedIds: Set<string> = new Set([
            ...[].concat(
        ...this.data.stations
          .filter(
            s =>
              s.contains != null &&
              s.contains.length > 0 &&
              s.groupType !== GroupType.SIMPLE_CHAIN
          )
          .map(s => s.contains)
      ),
            ...Array.from(invisibleStationIds),
            ...this.data.stations
        .filter(
          s =>
            s.contains != null &&
            s.contains.length > 0 &&
            s.groupType !== GroupType.SIMPLE_CHAIN
        )
        .map(s => s.id)
        ]);

        const inNodes: Map<string, string[]> = new Map();
        const outNodes: Map<string, string[]> = new Map();
        for (const delivery of this.data.deliveries.filter(d => !d.invisible)) {
            if (
        delivery.originalSource !== delivery.originalTarget &&
        !invisibleStationIds.has(delivery.originalTarget) &&
        !invisibleStationIds.has(delivery.originalSource)
      ) {
                if (delivery.originalTarget === 'S24') {
                }
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
      Array.from(inNodes.keys()).filter(
        idTarget =>
          inNodes.get(idTarget).filter(idSource => !ignoredIds.has(idSource))
            .length > 0
      )
    );
        const startNodes: string[] = Array.from(outNodes.keys()).filter(
      id => !nonStartNodeIds.has(id)
    );

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
                newChains.set(
          'SC:' + newChain[0] + '->' + newChain[newChain.length - 1],
          newChain
        );
            }
        }

        return newChains;
    }

    private getPositionOfStations(groupIds: string[]): Map<string, Position> {
        const result: Map<string, Position> = new Map();
        for (const station of this.getStationsById(groupIds)) {
            result.set(station.id, station.position);
        }
        return result;
    }

    private mapNewGroupsToOldGroups(
    newGroups: Map<string, string[]>,
    oldGroups: Map<string, string[]>
  ): Map<string, string> {
        const result: Map<string, string> = new Map();
        const availableOldGroupIds: Set<string> = new Set(oldGroups.keys());
    // for(let [newGroupId, newMemberIds] of newGroups) { // es6 syntax
    /*const newGroupsIterator: IterableIterator<string> = newGroups.keys();
    let myMap : Map<string, boolean> = new Map();
    myMap.forEach((value: boolean, key: string) => {
      console.log(key, value);
    });*/
        newGroups.forEach((newMemberIds: string[], newGroupId: string) => {
            const idSet: Set<string> = new Set(newMemberIds);
      // const idSet: Set<string> = new Set(newGroups.get(newGroupId));
      // for(let oldGroupId of availableOldGroupIds) { // es6 syntax
            for (const oldGroupId in availableOldGroupIds) {
                if (oldGroups.get(oldGroupId).findIndex(id => idSet.has(id)) >= 0) {
                    result.set(newGroupId, oldGroupId);
                    availableOldGroupIds.delete(oldGroupId);
                    break;
                }
            }
        });
        return result;
    }

    private getOldGroups(groupType: GroupType): Map<string, string[]> {
        const result: Map<string, string[]> = new Map();
        for (const filteredStation of this.data.stations.filter(
      station => station.groupType === groupType
    )) {
            result.set(filteredStation.id, filteredStation.contains);
        }
        return result;
    }

  /*private foo(): Map<string, string> {
    //const result: Map<string, string[]> = new Map();
    const t: {a: string, b: string}[] = [];
    return t.map(e => [e.a, e.b]);
    //return result;
  }*/

    private getNewSourceGroups(
    groupMode: GroupMode,
    oldGroups: Map<string, string[]>
  ): Map<string, string[]> {
        const oldSourceIdSet: Set<string> = new Set(
      [].concat(...Array.from(oldGroups.values()))
    );
        const sourceStations: StationData[] = this.data.stations.filter(
      s =>
        !s.invisible &&
        (s.contains == null || s.contains.length === 0) &&
        (s.incoming == null || s.incoming.length === 0) &&
        (s.outgoing != null && s.outgoing.length > 0) &&
        (!s.contained || oldSourceIdSet.has(s.id))
    );

        const targetIdToLinkGroupMap: Map<string, LinkGroup> = new Map();
        for (const source of sourceStations) {
            const deliveries: DeliveryData[] = this.getDeliveriesById(
        source.outgoing
      ).filter(d => !d.invisible);
            const targetStations: StationData[] = this.getStationsById(
        _.uniq(deliveries.map(d => d.originalTarget))
      ).filter(s => !s.invisible);
            if (targetStations.length === 1) {
                let targetKeys: string[];
                if (groupMode === GroupMode.WEIGHT_ONLY) {
                    targetKeys = [source.outbreak ? '1' : '0'];
                } else {
                    const sourceDeliveryIdSet: Set<string> = new Set(
            deliveries
              .filter(d => d.originalTarget === targetStations[0].id)
              .map(d => d.id)
          );
                    const targetDeliveries: DeliveryData[] = this.getDeliveriesById(
            targetStations[0].connections
              .filter(c => sourceDeliveryIdSet.has(c.source))
              .map(c => c.target)
          ).filter(d => !d.invisible);
                    if (targetDeliveries.length === 0) {
                        targetKeys = ['W>0:' + (source.outbreak ? '1' : '0')];
                    } else {
                        switch (groupMode) {
                            case GroupMode.PRODUCT_AND_WEIGHT:
                                targetKeys = _.uniq(
                  targetDeliveries.map(
                    d => 'W>0:' + (source.outbreak ? '1' : '0') + '_P:' + d.name
                  )
                ).sort();
                                break;
                            case GroupMode.LOT_AND_WEIGHT:
                                targetKeys = _.uniq(
                  targetDeliveries.map(
                    d => 'W>0:' + (source.outbreak ? '1' : '0') + '_L:' + d.lot
                  )
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
                        linkedStations: []
                    });
                }

                targetIdToLinkGroupMap.get(targetStations[0].id).linkedStations.push({
                    linkedStation: source,
                    linkKeys: targetKeys
                });
            }
        }

        return this.extractNewGroups(
      targetIdToLinkGroupMap,
      (linkGroup, newGroupNumber) =>
        'SG:' +
        linkGroup.linkStation.id +
        (newGroupNumber === 1 ? '' : '_' + newGroupNumber.toString())
    );
    }
    private getNewTargetGroups(
    groupMode: GroupMode,
    oldGroups: Map<string, string[]>
  ): Map<string, string[]> {
        const oldTargetIdSet: Set<string> = new Set(
      [].concat(...Array.from(oldGroups.values()))
    );
        const targetStations: StationData[] = this.data.stations.filter(s => {
            return (
        !s.invisible &&
        (s.contains === null || s.contains.length === 0) &&
        (s.outgoing === null || s.outgoing.length === 0) &&
        (s.incoming !== null && s.incoming.length > 0) &&
        (!s.contained || oldTargetIdSet.has(s.id))
            );
        });

        const sourceIdToLinkGroupMap: Map<
      string,
      {
          linkStation: StationData;
          linkedStations: { linkedStation: StationData; linkKeys: string[] }[];
      }
    > = new Map();
        for (const target of targetStations) {
            let deliveries: DeliveryData[] = this.getDeliveriesById(
        target.incoming
      ).filter(d => !d.invisible);
            const sourceStations: StationData[] = this.getStationsById(
        _.uniq(deliveries.map(d => d.originalSource))
      ).filter(s => !s.invisible);
            if (sourceStations.length === 1) {
                let sourceKeys: string[];
                if (groupMode === GroupMode.WEIGHT_ONLY) {
                    sourceKeys = ['W>0:' + (target.outbreak ? '1' : '0')];
                } else {
                    deliveries = deliveries.filter(
            d => d.originalSource === sourceStations[0].id
          );
                    if (deliveries.length === 0) {
                        sourceKeys = ['W>0:' + (target.outbreak ? '1' : '0')];
                    } else {
                        switch (groupMode) {
                            case GroupMode.PRODUCT_AND_WEIGHT:
                                sourceKeys = _.uniq(
                  deliveries.map(
                    d => 'W>0:' + (target.outbreak ? '1' : '0') + '_P:' + d.name
                  )
                ).sort();
                                break;
                            case GroupMode.LOT_AND_WEIGHT:
                                sourceKeys = _.uniq(
                  deliveries.map(
                    d => 'W>0:' + (target.outbreak ? '1' : '0') + '_L:' + d.lot
                  )
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
                        linkedStations: []
                    });
                }

                sourceIdToLinkGroupMap.get(sourceStations[0].id).linkedStations.push({
                    linkedStation: target,
                    linkKeys: sourceKeys
                });
            }
        }
        return this.extractNewGroups(
      sourceIdToLinkGroupMap,
      (linkedGroup, newGroupNumber) =>
        'TG:' +
        linkedGroup.linkStation.id +
        (newGroupNumber === 1 ? '' : '_' + newGroupNumber.toString())
    );
    }

    private getNewIsolatedGroups(
    oldGroups: Map<string, string[]>
  ): Map<string, string[]> {
        const result: Map<string, string[]> = new Map();

        const nonBlockingGroupTypes: Set<GroupType> = new Set([
            GroupType.ISOLATED_GROUP,
            GroupType.SIMPLE_CHAIN,
            GroupType.SOURCE_GROUP,
            GroupType.TARGET_GROUP
        ]);
        const invisibleStationIds: Set<string> = new Set(
      this.data.stations.filter(s => s.invisible).map(s => s.id)
    );
        const blockedIds: Set<string> = new Set([
            ...[].concat(
        ...this.data.stations
          .filter(
            s =>
              s.contains != null &&
              s.contains.length > 0 &&
              (s.groupType == null || !nonBlockingGroupTypes.has(s.groupType))
          )
          .map(s => s.contains)
      ),
            ...this.data.stations
        .filter(
          s =>
            s.contains != null &&
            s.contains.length > 0 &&
            (s.groupType == null || !nonBlockingGroupTypes.has(s.groupType))
        )
        .map(s => s.id)
        ]);

        const inNodes: Map<string, string[]> = new Map();
        const outNodes: Map<string, string[]> = new Map();
        for (const delivery of this.data.deliveries.filter(d => !d.invisible)) {
            const target: string = blockedIds.has(delivery.originalTarget)
        ? delivery.target
        : delivery.originalTarget;
            const source: string = blockedIds.has(delivery.originalSource)
        ? delivery.source
        : delivery.originalSource;
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

        inNodes.forEach((idSources: string[], idTarget: string) =>
      inNodes.set(idTarget, _.uniq(idSources))
    );
        outNodes.forEach((idTargets: string[], idSource: string) =>
      outNodes.set(idSource, _.uniq(idTargets))
    );

        const notIsolatedStationIds: Set<string> = new Set(
      this.data.stations
        .filter(s => !s.invisible && s.outbreak)
        .map(s => s.id)
        .concat(
          _.uniq(
            this.data.deliveries
              .filter(d => !d.invisible && d.weight > 0)
              .map(d =>
                blockedIds.has(d.originalSource) ? d.source : d.originalSource
              )
              .filter(id => !invisibleStationIds.has(id))
          )
        )
    );

        let currentStations: string[] = Array.from(notIsolatedStationIds);
        while (currentStations.length > 0) {
            currentStations = _.uniq(
        []
          .concat(...currentStations.map(id => inNodes.get(id)))
          .filter(id => id != null)
      ).filter(id => !notIsolatedStationIds.has(id));
            currentStations.forEach(id => notIsolatedStationIds.add(id));
        }

        const traverseStationIds: Set<string> = new Set(
      this.data.stations
        .filter(
          s =>
            !s.invisible &&
            (s.contains == null || s.contains.length === 0) &&
            !blockedIds.has(s.id) &&
            !notIsolatedStationIds.has(s.id)
        )
        .map(s => s.id)
    );
        const supportIds: Set<string> = new Set([
            ...Array.from(blockedIds),
            ...Array.from(notIsolatedStationIds)
        ]);
        const isolatedComponents: IsolatedComponent[] = [];
    // console.log('TraversingIds: ' + Array.from(traverseStationIds));
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
        const compareIsolatedComponents = (
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
        isolatedComponents.sort(compareIsolatedComponents);
    // console.log('IsolatedComponents: ');
    // isolatedComponents.forEach(isoComp => console.log('ids: ' + isoComp.ids + ', support: ' + isoComp.support));
        if (isolatedComponents.length > 0) {
            let groupMemberIds: string[] =
        isolatedComponents[isolatedComponents.length - 1].ids;
            for (let iC: number = isolatedComponents.length - 2; iC >= 0; iC--) {
                if (
          compareIsolatedComponents(
            isolatedComponents[iC],
            isolatedComponents[iC + 1]
          ) !== 0
        ) {
                    if (groupMemberIds.length > 1) {
                        result.set('IG:' + (result.size + 1).toString(), groupMemberIds);
                    }
                    groupMemberIds = isolatedComponents[iC].ids;
                } else {
                    groupMemberIds = groupMemberIds.concat(isolatedComponents[iC].ids);
                }
            }
            if (groupMemberIds.length > 1) {
                result.set('IG:' + (result.size + 1).toString(), groupMemberIds);
            }
        }

        return result;
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
            for (const linkId of _.uniq(
        f(inNodes.get(id)).concat(f(outNodes.get(id)))
      )) {
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

    private extractNewGroups(
    map: Map<string, LinkGroup>,
    namingFun: GroupNamingFun
  ): Map<string, string[]> {
        const compareNumbers = (a, b) => (a < b ? -1 : a === b ? 0 : 1);
        const newGroups: Map<string, string[]> = new Map();
        map.forEach(linkStation => {
            linkStation.linkedStations.sort((a, b) =>
        compareNumbers(a.linkKeys.length, b.linkKeys.length)
      );
            let size: number = 0;
            const linkIndices: Set<number> = new Set();
            for (
        // tslint:disable-next-line:one-variable-per-declaration
        let iLinkedStation: number = 0,
            nLinkedStations: number = linkStation.linkedStations.length;
        iLinkedStation < nLinkedStations;
        iLinkedStation++
      ) {
                if (
          linkStation.linkedStations[iLinkedStation].linkKeys.length !== size
        ) {
                    this.addNewGroups(linkStation, newGroups, linkIndices, namingFun);
                    size = linkStation.linkedStations[iLinkedStation].linkKeys.length;
                }
                linkIndices.add(iLinkedStation);
            }
            this.addNewGroups(linkStation, newGroups, linkIndices, namingFun);
        });
        return newGroups;
    }

    private addNewGroups(
    linkGroup: LinkGroup,
    newGroups: Map<string, string[]>,
    linkIndices: Set<number>,
    namingFun: any
  ) {
        if (linkIndices.size > 1) {
            let newGroup: string[] = [];
            while (linkIndices.size > 0) {
                const compareIndex: number = linkIndices.values().next().value;
                linkIndices.delete(compareIndex);
                const compareKeys: string[] =
          linkGroup.linkedStations[compareIndex].linkKeys;
                newGroup.push(linkGroup.linkedStations[compareIndex].linkedStation.id);
                const removeIndices: number[] = [];
                linkIndices.forEach(i => {
                    if (_.isEqual(compareKeys, linkGroup.linkedStations[i].linkKeys)) {
                        removeIndices.push(i);
                    }
                });
                removeIndices.forEach(i => {
                    linkIndices.delete(i);
                    newGroup.push(linkGroup.linkedStations[i].linkedStation.id);
                });
                if (newGroup.length > 1) {
                    newGroups.set(namingFun(linkGroup, newGroups.size + 1), newGroup);
                } // newGroups.set('SG:' + target.target.id + (newGroups.size==0?'':'_' + (newGroups.size+1).toString()),  newGroup);
                newGroup = [];
            }
        }
        linkIndices.clear();
    }

    expandStations(ids: string[]) {
        this.expandStationsInternal(ids);

        this.updateTrace();
        this.updateScores();
    }

    setSelected(id: string, selected: boolean) {
        if (this.stationsById.has(id)) {
            this.stationsById.get(id).selected = selected;
        } else if (this.deliveriesById.has(id)) {
            this.deliveriesById.get(id).selected = selected;
        }
    }

    clearInvisibility() {
        this.stationsById.forEach(s => {
            s.invisible = false;
        });
        this.deliveriesById.forEach(d => {
            d.invisible = false;
        });

        this.updateTrace();
        this.updateScores();
    }

    makeStationsInvisible(ids: string[]) {
        for (const id of ids) {
            this.stationsById.get(id).invisible = true;
        }

        this.deliveriesById.forEach(d => {
            if (ids.indexOf(d.source) !== -1 || ids.indexOf(d.target) !== -1) {
                d.invisible = true;
            }
        });

        this.updateTrace();
        this.updateScores();
    }

    clearOutbreakStations() {
        this.stationsById.forEach(s => {
            s.outbreak = false;
        });

        this.updateScores();
    }

    markStationsAsOutbreak(ids: string[], outbreak: boolean) {
        for (const id of ids) {
            this.stationsById.get(id).outbreak = outbreak;
        }

        this.updateScores();
    }

    setCrossContaminationOfStations(ids: string[], crossContamination: boolean) {
        for (const id of ids) {
            this.stationsById.get(id).crossContamination = crossContamination;
        }

        this.updateTrace();
        this.updateScores();
    }

    clearTrace() {
        this.stationsById.forEach(s => {
            s.observed = ObservedType.NONE;
            s.forward = false;
            s.backward = false;
        });
        this.deliveriesById.forEach(d => {
            d.observed = ObservedType.NONE;
            d.forward = false;
            d.backward = false;
        });
    }

    showStationTrace(id: string) {
        const station = this.stationsById.get(id);

        this.clearTrace();
        station.observed = ObservedType.FULL;
        station.outgoing.forEach(outId =>
      this.showDeliveryForwardTraceInternal(outId)
    );
        station.incoming.forEach(inId =>
      this.showDeliveryBackwardTraceInternal(inId)
    );
    }

    showStationForwardTrace(id: string) {
        const station = this.stationsById.get(id);

        this.clearTrace();
        station.observed = ObservedType.FORWARD;
        station.outgoing.forEach(outId =>
      this.showDeliveryForwardTraceInternal(outId)
    );
    }

    showStationBackwardTrace(id: string) {
        const station = this.stationsById.get(id);

        this.clearTrace();
        station.observed = ObservedType.BACKWARD;
        station.incoming.forEach(inId =>
      this.showDeliveryBackwardTraceInternal(inId)
    );
    }

    showDeliveryTrace(id: string) {
        const delivery = this.deliveriesById.get(id);

        this.clearTrace();
        delivery.observed = ObservedType.FULL;

        const sourceStation = this.stationsById.get(delivery.source);
        const targetStation = this.stationsById.get(delivery.target);

        sourceStation.backward = true;
        this.getBackwardDeliveries(sourceStation, delivery).forEach(d =>
      this.showDeliveryBackwardTraceInternal(d)
    );
        targetStation.forward = true;
        this.getForwardDeliveries(targetStation, delivery).forEach(d =>
      this.showDeliveryForwardTraceInternal(d)
    );
    }

    showDeliveryForwardTrace(id: string) {
        const delivery = this.deliveriesById.get(id);

        this.clearTrace();
        delivery.observed = ObservedType.FORWARD;

        const targetStation = this.stationsById.get(delivery.target);

        targetStation.forward = true;
        this.getForwardDeliveries(targetStation, delivery).forEach(d =>
      this.showDeliveryForwardTraceInternal(d)
    );
    }

    showDeliveryBackwardTrace(id: string) {
        const delivery = this.deliveriesById.get(id);

        this.clearTrace();
        delivery.observed = ObservedType.BACKWARD;

        const sourceStation = this.stationsById.get(delivery.source);

        sourceStation.backward = true;
        this.getBackwardDeliveries(sourceStation, delivery).forEach(d =>
      this.showDeliveryBackwardTraceInternal(d)
    );
    }

    setConnectionsOfStation(id: string, connections: Connection[]) {
        this.stationsById.get(id).connections = connections;
        this.updateTrace();
        this.updateScores();
    }

    private expandStationsInternal(ids: string[]) {
        for (const id of ids) {
            const station = this.stationsById.get(id);

            this.stationsById.delete(id);
            this.data.stations.splice(this.data.stations.indexOf(station), 1);

      /*for(const containedStation of this.getStationsById(station.contains)) {
          containedStation.contained = false;
          for(const delivery of this.getDeliveriesById(containedStation.incoming)) delivery.target=containedStation.id;
          for(const delivery of this.getDeliveriesById(containedStation.outgoing)) delivery.source=containedStation.id;
        }*/

            for (const containedId of station.contains) {
                this.stationsById.get(containedId).contained = false;
            }

            this.deliveriesById.forEach(d => {
                if (d.source === id) {
                    d.source = d.originalSource;
                }

                if (d.target === id) {
                    d.target = d.originalTarget;
                }
            });
        }
    }

    private updateScores() {
        let nOutbreaks = 0;

        this.maxScore = 0;

        this.stationsById.forEach(s => {
            s.score = 0;
            s.commonLink = false;
        });
        this.deliveriesById.forEach(d => {
            d.score = 0;
        });

        this.stationsById.forEach(s => {
            if (s.outbreak && !s.contained && !s.invisible) {
                nOutbreaks++;
                this.visited.clear();
                this.updateStationScore(s.id, s.id);
            }
        });

        if (nOutbreaks !== 0) {
            this.stationsById.forEach(s => {
                s.score /= nOutbreaks;
                s.commonLink = s.score === 1.0;
                this.maxScore = Math.max(this.maxScore, s.score);
            });
            this.deliveriesById.forEach(d => {
                d.score /= nOutbreaks;
            });
        }
    }

    private updateStationScore(id: string, outbreakId: string) {
        const station = this.stationsById.get(id);

        if (
      !this.visited.has(station.id) &&
      !station.contained &&
      !station.invisible
    ) {
            this.visited.add(station.id);
            station.score++;

            for (const d of station.incoming) {
                this.updateDeliveryScore(d, outbreakId);
            }
        }
    }

    private updateDeliveryScore(id: string, outbreakId: string) {
        const delivery = this.deliveriesById.get(id);

        if (!this.visited.has(delivery.id) && !delivery.invisible) {
            this.visited.add(delivery.id);
            delivery.score++;

            const source = this.stationsById.get(delivery.source);

            if (!this.visited.has(source.id)) {
                this.visited.add(source.id);
                source.score++;
            }

            this.getBackwardDeliveries(source, delivery).forEach(d =>
        this.updateDeliveryScore(d, outbreakId)
      );
        }
    }

    private showDeliveryForwardTraceInternal(id: string) {
        const delivery = this.deliveriesById.get(id);

        if (!delivery.forward && !delivery.invisible) {
            delivery.forward = true;

            const targetStation = this.stationsById.get(delivery.target);

            targetStation.forward = true;
            this.getForwardDeliveries(targetStation, delivery).forEach(d =>
        this.showDeliveryForwardTraceInternal(d)
      );
        }
    }

    private showDeliveryBackwardTraceInternal(id: string) {
        const delivery = this.deliveriesById.get(id);

        if (!delivery.backward && !delivery.invisible) {
            delivery.backward = true;

            const sourceStation = this.stationsById.get(delivery.source);

            sourceStation.backward = true;
            this.getBackwardDeliveries(sourceStation, delivery).forEach(d =>
        this.showDeliveryBackwardTraceInternal(d)
      );
        }
    }

    private getForwardDeliveries(
    station: StationData,
    delivery: DeliveryData
  ): string[] {
        if (station.crossContamination) {
            if (delivery.date != null) {
                const date = Utils.stringToDate(delivery.date);
                const forward: Set<string> = new Set(
          station.connections
            .filter(c => c.source === delivery.id)
            .map(c => c.target)
        );

                for (const id of station.outgoing) {
                    if (!forward.has(id)) {
                        const d = this.getDeliveriesById([id])[0];

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
            return station.connections
        .filter(c => c.source === delivery.id)
        .map(c => c.target);
        }
    }

    private getBackwardDeliveries(
    station: StationData,
    delivery: DeliveryData
  ): string[] {
        if (station.crossContamination) {
            if (delivery.date != null) {
                const date = Utils.stringToDate(delivery.date);
                const backward: Set<string> = new Set(
          station.connections
            .filter(c => c.target === delivery.id)
            .map(c => c.source)
        );

                for (const id of station.incoming) {
                    if (!backward.has(id)) {
                        const d = this.getDeliveriesById([id])[0];

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

    private updateTrace() {
        let observedStation: StationData = null;
        let observedDelivery: DeliveryData = null;

        this.stationsById.forEach(s => {
            if (s.observed !== ObservedType.NONE) {
                observedStation = s;
            }
        });
        this.deliveriesById.forEach(d => {
            if (d.observed !== ObservedType.NONE) {
                observedDelivery = d;
            }
        });

        if (observedStation != null) {
            if (observedStation.invisible || observedStation.contained) {
                this.clearTrace();
            } else {
                switch (observedStation.observed) {
                    case ObservedType.FULL:
                        this.showStationTrace(observedStation.id);
                        break;
                    case ObservedType.FORWARD:
                        this.showStationForwardTrace(observedStation.id);
                        break;
                    case ObservedType.BACKWARD:
                        this.showStationBackwardTrace(observedStation.id);
                        break;
                }
            }
        } else if (observedDelivery != null) {
            if (observedDelivery.invisible) {
                this.clearTrace();
            } else {
                switch (observedDelivery.observed) {
                    case ObservedType.FULL:
                        this.showDeliveryTrace(observedDelivery.id);
                        break;
                    case ObservedType.FORWARD:
                        this.showDeliveryForwardTrace(observedDelivery.id);
                        break;
                    case ObservedType.BACKWARD:
                        this.showDeliveryBackwardTrace(observedDelivery.id);
                        break;
                }
            }
        } else {
            this.clearTrace();
        }
    }
}
