import {Injectable} from '@angular/core';
import {Connection, DeliveryData, FclElements, ObservedType, Position, StationData, GroupMode, GroupType} from '../util/datatypes';
import {Utils} from '../util/utils';
import * as _ from 'lodash';

/*class IndexArray {
  private firstNotRemovedIndex: number;
  private nextIndex: number[];
  private previousIndex: number[];
  private removed: boolean[];
  private count: number;
  constructor(indices: number[]) {
    this.firstNotRemovedIndex = Math.min(0,indices.length-1);
    this.removed = [];
    for(let i: number = indices.length-1; i>=0; i-- ) this.removed[i];
    this.count = indices.length;
    this.nextIndex = [];
    this.nextIndex[indices.length-1] = null;
    for(let i: number = indices.length-2; i>=0; i-- ) this.nextIndex[i] = i+1;
    this.previousIndex = [];
    for(let i: number = indices.length-1; i>0; i-- ) this.previousIndex[i] = i-1;
  }  
  protected remove(index: number) {
    if(this.removed[index]) return;
    this.removed[index] = false;
    if(index==this.firstNotRemovedIndex) {
      this.firstNotRemovedIndex = this.nextIndex[index];
    } else {
      this.nextIndex[this.previousIndex[index]] = this.nextIndex[index];
      const tmpIndex: number = this.next
    }
    
  }
  protected getNextIndex(index: number): number {
    if(this.removed[index]) return null;
    return this.nextIndex[index];
  }
  protected size(): number {
    
  }
}*/
interface SourceTarget {
  target: StationData,
  sources: {
    source: StationData,
    targetKeys: string[]
  }[]
}

@Injectable()
export class TracingService {
  
  private data: FclElements;
  private stationsById: Map<string, StationData> = new Map();
  private deliveriesById: Map<string, DeliveryData> = new Map();
  private maxScore: number;
  
  private visited: Set<string> = new Set();
  
  constructor() {
  }
  
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
  
  mergeStations(ids: string[], name: string, groupType: GroupType) {
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
      if (!this.stationsById.has(i.toString()) && !this.deliveriesById.has(i.toString())) {
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
      metaStation.connections = metaStation.connections.concat(station.connections);
      
      station.incoming.forEach(d => this.deliveriesById.get(d).target = metaId);
      station.outgoing.forEach(d => this.deliveriesById.get(d).source = metaId);
      
      if (coordinates != null) {
        if (station.lat != null && station.lon != null) {
          coordinates.push({x: station.lon, y: station.lat});
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
    
    this.updateTrace();
    this.updateScores();
  }
  
  groupSourceStations(groupMode: GroupMode) {
    const {groups: oldGroups, memberToGroupMap: oldMemberToGroupMap} = this.getOldSourceGroups();
    const newGroups: Map<string, string[]> =  this.getNewSourceGroups(groupMode);
    const newToOldGroupMap: Map<string, string> = this.mapNewGroupsToOldGroups(newGroups, oldGroups);
    //const newMemberToGroupMap: Map<string, number> = new Map();
    //const newGroupMemberIds: string[] = _.flatten(newGroups);



    //const interSectionCounts: number[][] = [];
    
    //const reuseGroupIds: string[] = _.uniq(newGroupMemberIds.map(id=>oldMemberToGroupMap.get(id)).filter(gid=>gid!=null));

    /*for(let iOldG: number = reuseGroupIds.length-1; iOldG>=0; iOldG--) {
      for(let iNewG: number = newGroups.length-1; iNewG>=0; iNewG--) {
        interSectionCounts[iNewG][iOldG] = _.intersection(newGroups[iNewG], oldGroups.get(reuseGroupIds[iOldG])).length;
      }
    }
    const maxNewGroupIntersectionCounts: number[] = interSectionCounts.map(counts => Math.max(...counts));
    const maxIntersection: number = Math.max(..._.flatten(interSectionCounts));
    */
  }

  private mapNewGroupsToOldGroups(newGroups: Map<string, string[]>, oldGroups: Map<string, string[]>): Map<string,string> {
    const result: Map<string,string> = new Map();
    for(let [key, value] of newGroups) {
      for(let [key2, value2] of oldGroups) {
        result.set(key,key2);
        break;
      }
    }
  }
  
  private getOldSourceGroups(): {groups: Map<string, string[]>, memberToGroupMap: Map<string,string>} {
    const groups: Map<string, string[]> = new Map();
    const memberToGroupMap: Map<string,string> = new Map();
    
    for(let station of this.data.stations) {
      if(station.groupType==GroupType.SOURCE_GROUP) {
        groups.set(station.id, station.contains.slice());
        station.contains.forEach(id => memberToGroupMap.set(id, station.id));
      }
    }
    return {groups: groups, memberToGroupMap: memberToGroupMap};
  }
  
  private getNewSourceGroups(groupMode: GroupMode): String[][] {
    const sourceStations: StationData[] = this.data.stations.filter(s => !s.invisible && (s.contains==null || s.contains.length==0) && (s.incoming==null || s.incoming.length==0) && (s.outgoing!=null && s.outgoing.length>0));
    
    const map: Map<string, {target: StationData, sources: {source: StationData, targetKeys: string[]}[]}> = new Map();
    for(let source of sourceStations) {
      
      const deliveries: DeliveryData[] = this.getDeliveriesById(source.outgoing).filter(d=>!d.invisible);
      const targetStations: StationData[] = this.getStationsById(_.uniq(deliveries.map(d=>d.originalTarget))).filter(s => !s.invisible);
      if(targetStations.length==1) {
        let targetKeys: string[];
        if(groupMode==GroupMode.WEIGHT_ONLY) {
          targetKeys = [(source.outbreak?'1':'0')];
        } else {
          const sourceDeliveryIdSet: Set<string> = new Set(deliveries.filter(d=>d.originalTarget==targetStations[0].id).map(d=>d.id));
          const targetDeliveries: DeliveryData[] = this.getDeliveriesById(targetStations[0].connections.filter(c=>sourceDeliveryIdSet.has(c.source)).map(c=>c.target)).filter(d=>!d.invisible);
          if(targetDeliveries.length==0) targetKeys = ['W>0:' + (source.outbreak?'1':'0')];
          else {
            switch(groupMode) {
              case GroupMode.PRODUCT_AND_WEIGHT: 
              targetKeys = targetDeliveries.map(d=>'W>0:' + (source.outbreak?'1':'0') + '_P:' + d.name).sort();
              break;
              case GroupMode.LOT_AND_WEIGHT:
              targetKeys = targetDeliveries.map(d=>'W>0:' + (source.outbreak?'1':'0') + '_L:' + d.lot).sort();
              break;
              default:
              // unkown mode
              return;
            }
          }
        }
        
        if(!map.has(targetStations[0].id)) map.set(targetStations[0].id, {
          target: targetStations[0],
          sources: []
        });
        
        map.get(targetStations[0].id).sources.push({
          source: source,
          targetKeys: targetKeys
        });
      }
    }

    const compareNumbers = (a,b) => (a<b?-1:(a==b?0:1));
    const newGroups: string[][] = [];
    map.forEach(target => {
      target.sources.sort((a,b) => compareNumbers(a.targetKeys.length, b.targetKeys.length));
      let size: number = 0;
      const sourceIndices: Set<number> = new Set();
      for(let iSource: number = 0, nSources: number = target.sources.length; iSource<nSources; iSource++) {
        if(target.sources[iSource].targetKeys.length!=size) {
          this.addNewGroups(target, newGroups, sourceIndices);
          size = target.sources[iSource].targetKeys.length;
        }
        sourceIndices.add(iSource);
      }
      this.addNewGroups(target, newGroups, sourceIndices);
    });
    return newGroups;
  }

  private addNewGroups(target: SourceTarget, newGroups: string[][], sourceIndices: Set<number> ) {
    if(sourceIndices.size>1) {
      let newGroup: string[] = [];
      while(sourceIndices.size>0) {
        const compareIndex: number = sourceIndices.values().next().value;
        sourceIndices.delete(compareIndex);
        const compareKeys: string[] = target.sources[compareIndex].targetKeys;
        newGroup.push(target.sources[compareIndex].source.id);
        const removeIndices: number[] = [];
        sourceIndices.forEach(iS => {
          if(_.isEqual(compareKeys, target.sources[iS].targetKeys)) removeIndices.push(iS);
        });
        removeIndices.forEach(iS => {
          sourceIndices.delete(iS);
          newGroup.push(target.sources[iS].source.id);
        });
        if(newGroup.length>1) newGroups.push(newGroup);
        newGroup = [];
      }
    }
    sourceIndices.clear();
  }

  
  /*private getTargetKeys(station: StationData, groupMode: GroupMode): string[] {
    const result: string[] = [];
    const deliveries: DeliveryData[] = this.getDeliveriesById(station.outgoing).filter(d => !d.invisible);
    
    switch(groupMode) {
      case GroupMode.WEIGHT_ONLY:
      return deliveries.map(d => d.originalTarget + (station.outbreak?'1':'0'));
      case GroupMode.PRODUCT_AND_WEIGHT
      return deliveries.map(d => d.originalTarget + this.getStationsById([d.originalTarget])[0].   (station.outbreak?'1':'0'));
    }
  }*/
  
  /*private getTargetProducts(delivery: DeliveryData): string[] {
    const target: StationData = _.head(this.getStationsById(delivery.originalTarget));
    if(target!=null && !target.invisible) {
      const targetdeliveries: DeliveryData[] = this.getDeliveriesById(target.connections.filter(c => c.source==delivery.id).map(c=>c.target)).filter(d=>!d.invisible);
      
    } 
  }
  
  getTrueTargets(deliveryIds: string[]): StationData[] {
    const deliveries: DeliveryData[] = this.getDeliveriesById(deliveryIds);
  }*/
  
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
    station.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    station.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }
  
  showStationForwardTrace(id: string) {
    const station = this.stationsById.get(id);
    
    this.clearTrace();
    station.observed = ObservedType.FORWARD;
    station.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
  }
  
  showStationBackwardTrace(id: string) {
    const station = this.stationsById.get(id);
    
    this.clearTrace();
    station.observed = ObservedType.BACKWARD;
    station.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }
  
  showDeliveryTrace(id: string) {
    const delivery = this.deliveriesById.get(id);
    
    this.clearTrace();
    delivery.observed = ObservedType.FULL;
    
    const sourceStation = this.stationsById.get(delivery.source);
    const targetStation = this.stationsById.get(delivery.target);
    
    sourceStation.backward = true;
    this.getBackwardDeliveries(sourceStation, delivery).forEach(d => this.showDeliveryBackwardTraceInternal(d));
    targetStation.forward = true;
    this.getForwardDeliveries(targetStation, delivery).forEach(d => this.showDeliveryForwardTraceInternal(d));
  }
  
  showDeliveryForwardTrace(id: string) {
    const delivery = this.deliveriesById.get(id);
    
    this.clearTrace();
    delivery.observed = ObservedType.FORWARD;
    
    const targetStation = this.stationsById.get(delivery.target);
    
    targetStation.forward = true;
    this.getForwardDeliveries(targetStation, delivery).forEach(d => this.showDeliveryForwardTraceInternal(d));
  }
  
  showDeliveryBackwardTrace(id: string) {
    const delivery = this.deliveriesById.get(id);
    
    this.clearTrace();
    delivery.observed = ObservedType.BACKWARD;
    
    const sourceStation = this.stationsById.get(delivery.source);
    
    sourceStation.backward = true;
    this.getBackwardDeliveries(sourceStation, delivery).forEach(d => this.showDeliveryBackwardTraceInternal(d));
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
    
    if (!this.visited.has(station.id) && !station.contained && !station.invisible) {
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
      
      this.getBackwardDeliveries(source, delivery).forEach(d => this.updateDeliveryScore(d, outbreakId));
    }
  }
  
  private showDeliveryForwardTraceInternal(id: string) {
    const delivery = this.deliveriesById.get(id);
    
    if (!delivery.forward && !delivery.invisible) {
      delivery.forward = true;
      
      const targetStation = this.stationsById.get(delivery.target);
      
      targetStation.forward = true;
      this.getForwardDeliveries(targetStation, delivery).forEach(d => this.showDeliveryForwardTraceInternal(d));
    }
  }
  
  private showDeliveryBackwardTraceInternal(id: string) {
    const delivery = this.deliveriesById.get(id);
    
    if (!delivery.backward && !delivery.invisible) {
      delivery.backward = true;
      
      const sourceStation = this.stationsById.get(delivery.source);
      
      sourceStation.backward = true;
      this.getBackwardDeliveries(sourceStation, delivery).forEach(d => this.showDeliveryBackwardTraceInternal(d));
    }
  }
  
  private getForwardDeliveries(station: StationData, delivery: DeliveryData): string[] {
    if (station.crossContamination) {
      if (delivery.date != null) {
        const date = Utils.stringToDate(delivery.date);
        const forward: Set<string> = new Set(station.connections.filter(c => c.source === delivery.id).map(c => c.target));
        
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
      return station.connections.filter(c => c.source === delivery.id).map(c => c.target);
    }
  }
  
  private getBackwardDeliveries(station: StationData, delivery: DeliveryData): string[] {
    if (station.crossContamination) {
      if (delivery.date != null) {
        const date = Utils.stringToDate(delivery.date);
        const backward: Set<string> = new Set(station.connections.filter(c => c.target === delivery.id).map(c => c.source));
        
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
      return station.connections.filter(c => c.target === delivery.id).map(c => c.source);
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
