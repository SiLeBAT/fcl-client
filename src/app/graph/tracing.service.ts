import {Injectable} from '@angular/core';

@Injectable()
export class TracingService {

  private stations = [];
  private deliveries = [];
  private elementsById = {};

  constructor() {
  }

  init(data: any) {
    this.stations = data.stations;
    this.deliveries = data.deliveries;
    this.elementsById = {};

    for (const s of this.stations) {
      this.elementsById[s.data.id] = s;
    }

    for (const d of this.deliveries) {
      this.elementsById[d.data.id] = d;
    }
  }

  getElementsById(ids: any[]) {
    return ids.map(id => this.elementsById[id]);
  }

  mergeStations(ids: any[], name: string) {
    let metaId;

    for (let i = 1; ; i++) {
      if (!this.elementsById.hasOwnProperty(i.toString())) {
        metaId = i.toString();
        break;
      }
    }

    const metaStation = {
      data: {
        id: metaId,
        name: name,
        isEdge: false,
        type: 'Meta Station',
        contains: ids,
        selected: true,
        incoming: [],
        outgoing: []
      }
    };

    for (const id of ids) {
      this.elementsById[id].data.contained = true;
      delete this.elementsById[id].data.observed;
    }

    for (const d of this.deliveries) {
      if (ids.indexOf(d.data.source) !== -1) {
        d.data.originalSource = d.data.source;
        d.data.source = metaId;
        metaStation.data.outgoing.push(d.data.id);
      }

      if (ids.indexOf(d.data.target) !== -1) {
        d.data.originalTarget = d.data.target;
        d.data.target = metaId;
        metaStation.data.incoming.push(d.data.id);
      }
    }

    this.stations.push(metaStation);
    this.elementsById[metaId] = metaStation;
    this.updateTrace();
    this.updateScores();
  }

  expandStation(id: any) {
    const station = this.elementsById[id];

    delete this.elementsById[id];
    this.stations.splice(this.stations.indexOf(station), 1);

    for (const containedId of station.data.contains) {
      this.elementsById[containedId].data.contained = false;
    }

    for (const d of this.deliveries) {
      if (d.data.source === id) {
        d.data.source = d.data.originalSource;
        delete d.data.originalSource;
      }

      if (d.data.target === id) {
        d.data.target = d.data.originalTarget;
        delete d.data.originalTarget;
      }
    }

    this.updateTrace();
    this.updateScores();
  }

  setSelected(id: any, selected: boolean) {
    this.elementsById[id].data.selected = selected;
  }

  clearInvisibility() {
    for (const s of this.stations) {
      s.data.invisible = false;
    }
    for (const d of this.deliveries) {
      d.data.invisible = false;
    }

    this.updateTrace();
    this.updateScores();
  }

  makeStationsInvisible(ids: any[]) {
    for (const id of ids) {
      this.elementsById[id].data.invisible = true;
    }
    for (const d of this.deliveries) {
      if (ids.indexOf(d.data.source) !== -1 || ids.indexOf(d.data.target) !== -1) {
        d.data.invisible = true;
      }
    }

    this.updateTrace();
    this.updateScores();
  }

  clearOutbreakStations() {
    for (const s of this.stations) {
      s.data.outbreak = false;
    }

    this.updateScores();
  }

  toggleOutbreakStation(id: any) {
    const station = this.elementsById[id];

    station.data.outbreak = !station.data.outbreak;
    this.updateScores();
  }

  markStationsAsOutbreak(ids: any[]) {
    for (const id of ids) {
      this.elementsById[id].data.outbreak = true;
    }

    this.updateScores();
  }

  clearTrace() {
    for (const s of this.stations) {
      delete s.data.observed;
      s.data.forward = false;
      s.data.backward = false;
    }
    for (const d of this.deliveries) {
      delete d.data.observed;
      d.data.forward = false;
      d.data.backward = false;
    }
  }

  showStationTrace(id: any) {
    const station = this.elementsById[id];

    this.clearTrace();
    station.data.observed = 'full';
    station.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    station.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  showStationForwardTrace(id: any) {
    const station = this.elementsById[id];

    this.clearTrace();
    station.data.observed = 'forward';
    station.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
  }

  showStationBackwardTrace(id: any) {
    const station = this.elementsById[id];

    this.clearTrace();
    station.data.observed = 'backward';
    station.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  showDeliveryTrace(id: any) {
    const delivery = this.elementsById[id];

    this.clearTrace();
    delivery.data.observed = 'full';
    this.elementsById[delivery.data.target].data.forward = true;
    this.elementsById[delivery.data.source].data.backward = true;
    delivery.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    delivery.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  showDeliveryForwardTrace(id: any) {
    const delivery = this.elementsById[id];

    this.clearTrace();
    delivery.data.observed = 'forward';
    this.elementsById[delivery.data.target].data.forward = true;
    delivery.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
  }

  showDeliveryBackwardTrace(id: any) {
    const delivery = this.elementsById[id];

    this.clearTrace();
    delivery.data.observed = 'backward';
    this.elementsById[delivery.data.source].data.backward = true;
    delivery.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
  }

  private updateScores() {
    let nOutbreaks = 0;

    for (const s of this.stations) {
      s.data.score = 0;
      s.data.commonLink = false;
    }

    for (const d of this.deliveries) {
      d.data.score = 0;
    }

    for (const s of this.stations) {
      if (s.data.outbreak && !s.data.contained && !s.data.invisible) {
        nOutbreaks++;
        this.updateStationScore(s.data.id, s.data.id);
      }
    }

    if (nOutbreaks !== 0) {
      for (const s of this.stations) {
        s.data.score /= nOutbreaks;
        s.data.commonLink = s.data.score === 1.0;
        delete s.data._visited;
      }

      for (const d of this.deliveries) {
        d.data.score /= nOutbreaks;
        delete d.data._visited;
      }
    }
  }

  private updateStationScore(id: any, outbreakId: any) {
    const station = this.elementsById[id];

    if (station.data._visited !== outbreakId && !station.data.contained && !station.data.invisible) {
      station.data._visited = outbreakId;
      station.data.score++;

      for (const d of station.data.incoming) {
        this.updateDeliveryScore(d, outbreakId);
      }
    }
  }

  private updateDeliveryScore(id: any, outbreakId: any) {
    const delivery = this.elementsById[id];

    if (delivery.data._visited !== outbreakId && !delivery.data.invisible) {
      delivery.data._visited = outbreakId;
      delivery.data.score++;

      const source = this.elementsById[delivery.data.source];

      if (source.data._visited !== outbreakId) {
        source.data._visited = outbreakId;
        source.data.score++;
      }

      for (const d of delivery.data.incoming) {
        this.updateDeliveryScore(d, outbreakId);
      }
    }
  }

  private showDeliveryForwardTraceInternal(id: any) {
    const delivery = this.elementsById[id];

    if (!delivery.data.forward && !delivery.data.invisible) {
      delivery.data.forward = true;
      this.elementsById[delivery.data.target].data.forward = true;
      delivery.data.outgoing.forEach(outId => this.showDeliveryForwardTraceInternal(outId));
    }
  }

  private showDeliveryBackwardTraceInternal(id: any) {
    const delivery = this.elementsById[id];

    if (!delivery.data.backward && !delivery.data.invisible) {
      delivery.data.backward = true;
      this.elementsById[delivery.data.source].data.backward = true;
      delivery.data.incoming.forEach(inId => this.showDeliveryBackwardTraceInternal(inId));
    }
  }

  private updateTrace() {
    const observedElement = this.stations.concat(this.deliveries).find(e => e.data.observed);

    if (observedElement == null) {
      this.clearTrace();
    } else {
      const id = observedElement.data.id;
      const observed = observedElement.data.observed;

      if (!observedElement.data.invisible && !observedElement.data.contained) {
        if (observedElement.data.isEdge) {
          switch (observed) {
            case 'full':
              this.showDeliveryTrace(id);
              break;
            case 'forward':
              this.showDeliveryForwardTrace(id);
              break;
            case 'backward':
              this.showDeliveryBackwardTrace(id);
              break;
          }
        } else {
          switch (observed) {
            case 'full':
              this.showStationTrace(id);
              break;
            case 'forward':
              this.showStationForwardTrace(id);
              break;
            case 'backward':
              this.showStationBackwardTrace(id);
              break;
          }
        }
      }
    }
  }

}
