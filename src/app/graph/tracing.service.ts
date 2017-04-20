import {Injectable} from '@angular/core';
import {DeliveryData, FclElements, ObservedType, StationData} from '../util/datatypes';

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

  mergeStations(ids: string[], name: string) {
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
      incoming: [],
      outgoing: [],
      invisible: false,
      contained: false,
      contains: ids,
      selected: true,
      observed: ObservedType.NONE,
      forward: false,
      backward: false,
      outbreak: false,
      score: 0,
      commonLink: false,
      position: null,
      positionRelativeTo: null,
      properties: []
    };

    for (const id of ids) {
      this.stationsById.get(id).contained = true;
      this.stationsById.get(id).observed = ObservedType.NONE;
    }

    this.deliveriesById.forEach(d => {
      if (ids.indexOf(d.source) !== -1) {
        d.source = metaId;
        metaStation.outgoing.push(d.id);
      }

      if (ids.indexOf(d.target) !== -1) {
        d.target = metaId;
        metaStation.incoming.push(d.id);
      }
    });

    this.stationsById.set(metaId, metaStation);
    this.data.stations.push(metaStation);
    this.updateTrace();
    this.updateScores();
  }

  expandStations(ids: string[]) {
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
    this.stationsById.get(delivery.target).forward = true;
    this.stationsById.get(delivery.source).backward = true;
    delivery.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    delivery.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  showDeliveryForwardTrace(id: string) {
    const delivery = this.deliveriesById.get(id);

    this.clearTrace();
    delivery.observed = ObservedType.FORWARD;
    this.stationsById.get(delivery.target).forward = true;
    delivery.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
  }

  showDeliveryBackwardTrace(id: string) {
    const delivery = this.deliveriesById.get(id);

    this.clearTrace();
    delivery.observed = ObservedType.BACKWARD;
    this.stationsById.get(delivery.source).backward = true;
    delivery.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
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

      for (const d of delivery.incoming) {
        this.updateDeliveryScore(d, outbreakId);
      }
    }
  }

  private showDeliveryForwardTraceInternal(id: string) {
    const delivery = this.deliveriesById.get(id);

    if (!delivery.forward && !delivery.invisible) {
      delivery.forward = true;
      this.stationsById.get(delivery.target).forward = true;
      delivery.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    }
  }

  private showDeliveryBackwardTraceInternal(id: string) {
    const delivery = this.deliveriesById.get(id);

    if (!delivery.backward && !delivery.invisible) {
      delivery.backward = true;
      this.stationsById.get(delivery.source).backward = true;
      delivery.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
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
