import {Injectable} from '@angular/core';
import {DeliveryData, FclElements, ObservedType, StationData} from '../util/datatypes';

@Injectable()
export class TracingService {

  private data: FclElements;
  private stationsById: Map<string, { data: StationData }> = new Map();
  private deliveriesById: Map<string, { data: DeliveryData }> = new Map();
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
      this.stationsById.set(s.data.id, s);
      this.maxScore = Math.max(this.maxScore, s.data.score);
    }

    for (const d of data.deliveries) {
      this.deliveriesById.set(d.data.id, d);
    }
  }

  getMaxScore() {
    return this.maxScore;
  }

  getStationsById(ids: string[]): { data: StationData }[] {
    return ids.map(id => this.stationsById.get(id));
  }

  getDeliveriesById(ids: string[]): { data: DeliveryData }[] {
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

    const metaStation: { data: StationData } = {
      data: {
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
        positionRelativeTo: null
      }
    };

    for (const id of ids) {
      this.stationsById.get(id).data.contained = true;
      this.stationsById.get(id).data.observed = ObservedType.NONE;
    }

    this.deliveriesById.forEach(d => {
      if (ids.indexOf(d.data.source) !== -1) {
        d.data.source = metaId;
        metaStation.data.outgoing.push(d.data.id);
      }

      if (ids.indexOf(d.data.target) !== -1) {
        d.data.target = metaId;
        metaStation.data.incoming.push(d.data.id);
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
      this.data.stations.slice(this.data.stations.indexOf(station), 1);

      for (const containedId of station.data.contains) {
        this.stationsById.get(containedId).data.contained = false;
      }

      this.deliveriesById.forEach(d => {
        if (d.data.source === id) {
          d.data.source = d.data.originalSource;
        }

        if (d.data.target === id) {
          d.data.target = d.data.originalTarget;
        }
      });
    }

    this.updateTrace();
    this.updateScores();
  }

  setSelected(id: string, selected: boolean) {
    if (this.stationsById.has(id)) {
      this.stationsById.get(id).data.selected = selected;
    } else if (this.deliveriesById.has(id)) {
      this.deliveriesById.get(id).data.selected = selected;
    }
  }

  clearInvisibility() {
    this.stationsById.forEach(s => {
      s.data.invisible = false;
    });
    this.deliveriesById.forEach(d => {
      d.data.invisible = false;
    });

    this.updateTrace();
    this.updateScores();
  }

  makeStationsInvisible(ids: string[]) {
    for (const id of ids) {
      this.stationsById.get(id).data.invisible = true;
    }

    this.deliveriesById.forEach(d => {
      if (ids.indexOf(d.data.source) !== -1 || ids.indexOf(d.data.target) !== -1) {
        d.data.invisible = true;
      }
    });

    this.updateTrace();
    this.updateScores();
  }

  clearOutbreakStations() {
    this.stationsById.forEach(s => {
      s.data.outbreak = false;
    });

    this.updateScores();
  }

  markStationsAsOutbreak(ids: string[], outbreak: boolean) {
    for (const id of ids) {
      this.stationsById.get(id).data.outbreak = outbreak;
    }

    this.updateScores();
  }

  clearTrace() {
    this.stationsById.forEach(s => {
      s.data.observed = ObservedType.NONE;
      s.data.forward = false;
      s.data.backward = false;
    });
    this.deliveriesById.forEach(d => {
      d.data.observed = ObservedType.NONE;
      d.data.forward = false;
      d.data.backward = false;
    });
  }

  showStationTrace(id: string) {
    const station = this.stationsById.get(id);

    this.clearTrace();
    station.data.observed = ObservedType.FULL;
    station.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    station.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  showStationForwardTrace(id: string) {
    const station = this.stationsById.get(id);

    this.clearTrace();
    station.data.observed = ObservedType.FORWARD;
    station.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
  }

  showStationBackwardTrace(id: string) {
    const station = this.stationsById.get(id);

    this.clearTrace();
    station.data.observed = ObservedType.BACKWARD;
    station.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  showDeliveryTrace(id: string) {
    const delivery = this.deliveriesById.get(id);

    this.clearTrace();
    delivery.data.observed = ObservedType.FULL;
    this.stationsById.get(delivery.data.target).data.forward = true;
    this.stationsById.get(delivery.data.source).data.backward = true;
    delivery.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    delivery.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  showDeliveryForwardTrace(id: string) {
    const delivery = this.deliveriesById.get(id);

    this.clearTrace();
    delivery.data.observed = ObservedType.FORWARD;
    this.stationsById.get(delivery.data.target).data.forward = true;
    delivery.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
  }

  showDeliveryBackwardTrace(id: string) {
    const delivery = this.deliveriesById.get(id);

    this.clearTrace();
    delivery.data.observed = ObservedType.BACKWARD;
    this.stationsById.get(delivery.data.source).data.backward = true;
    delivery.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  private updateScores() {
    let nOutbreaks = 0;

    this.maxScore = 0;

    this.stationsById.forEach(s => {
      s.data.score = 0;
      s.data.commonLink = false;
    });
    this.deliveriesById.forEach(d => {
      d.data.score = 0;
    });

    this.stationsById.forEach(s => {
      if (s.data.outbreak && !s.data.contained && !s.data.invisible) {
        nOutbreaks++;
        this.visited.clear();
        this.updateStationScore(s.data.id, s.data.id);
      }
    });

    if (nOutbreaks !== 0) {
      this.stationsById.forEach(s => {
        s.data.score /= nOutbreaks;
        s.data.commonLink = s.data.score === 1.0;
        this.maxScore = Math.max(this.maxScore, s.data.score);
      });
      this.deliveriesById.forEach(d => {
        d.data.score /= nOutbreaks;
      });
    }
  }

  private updateStationScore(id: string, outbreakId: string) {
    const station = this.stationsById.get(id);

    if (!this.visited.has(station.data.id) && !station.data.contained && !station.data.invisible) {
      this.visited.add(station.data.id);
      station.data.score++;

      for (const d of station.data.incoming) {
        this.updateDeliveryScore(d, outbreakId);
      }
    }
  }

  private updateDeliveryScore(id: string, outbreakId: string) {
    const delivery = this.deliveriesById.get(id);

    if (!this.visited.has(delivery.data.id) && !delivery.data.invisible) {
      this.visited.add(delivery.data.id);
      delivery.data.score++;

      const source = this.stationsById.get(delivery.data.source);

      if (this.visited.has(source.data.id)) {
        this.visited.add(source.data.id);
        source.data.score++;
      }

      for (const d of delivery.data.incoming) {
        this.updateDeliveryScore(d, outbreakId);
      }
    }
  }

  private showDeliveryForwardTraceInternal(id: string) {
    const delivery = this.deliveriesById.get(id);

    if (!delivery.data.forward && !delivery.data.invisible) {
      delivery.data.forward = true;
      this.stationsById.get(delivery.data.target).data.forward = true;
      delivery.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    }
  }

  private showDeliveryBackwardTraceInternal(id: string) {
    const delivery = this.deliveriesById.get(id);

    if (!delivery.data.backward && !delivery.data.invisible) {
      delivery.data.backward = true;
      this.stationsById.get(delivery.data.source).data.backward = true;
      delivery.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
    }
  }

  private updateTrace() {
    let observedStation = null;
    let observedDelivery = null;

    this.stationsById.forEach(s => {
      if (s.data.observed !== ObservedType.NONE) {
        observedStation = s;
      }
    });
    this.deliveriesById.forEach(d => {
      if (d.data.observed !== ObservedType.NONE) {
        observedDelivery = d;
      }
    });

    if (observedStation != null) {
      if (observedStation.data.invisible || observedStation.data.contained) {
        this.clearTrace();
      } else {
        switch (observedStation.data.observed) {
          case ObservedType.FULL:
            this.showStationTrace(observedStation.data.id);
            break;
          case ObservedType.FORWARD:
            this.showStationForwardTrace(observedStation.data.id);
            break;
          case ObservedType.BACKWARD:
            this.showStationBackwardTrace(observedStation.data.id);
            break;
        }
      }
    } else if (observedDelivery != null) {
      if (observedDelivery.data.invisible) {
        this.clearTrace();
      } else {
        switch (observedDelivery.data.observed) {
          case ObservedType.FULL:
            this.showDeliveryTrace(observedDelivery.data.id);
            break;
          case ObservedType.FORWARD:
            this.showDeliveryForwardTrace(observedDelivery.data.id);
            break;
          case ObservedType.BACKWARD:
            this.showDeliveryBackwardTrace(observedDelivery.data.id);
            break;
        }
      }
    } else {
      this.clearTrace();
    }
  }

}
