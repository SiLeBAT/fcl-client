import {Injectable} from '@angular/core';
import {CyPosition, DeliveryData, FclElements, StationData, TableMode} from './datatypes';
import {MdDialog} from '@angular/material';
import {DialogAlertComponent, DialogAlertData} from '../dialog/dialog-alert/dialog-alert.component';
import {DataService} from './data.service';

@Injectable()
export class UtilService {

  private static STATION_DATA: StationData = {
    id: null, name: null, incoming: null, outgoing: null, invisible: null, contained: null, contains: null, selected: null, observed: null,
    forward: null, backward: null, outbreak: null, score: null, commonLink: null, position: null, positionRelativeTo: null, properties: null
  };

  private static DELIVERY_DATA: DeliveryData = {
    id: null, source: null, target: null, originalSource: null, originalTarget: null, incoming: null, outgoing: null, invisible: null,
    selected: null, observed: null, forward: null, backward: null, score: null, properties: null
  };

  static getStationProperties(): string[] {
    return Object.keys(UtilService.STATION_DATA);
  }

  static getDeliveryProperties(): string[] {
    return Object.keys(UtilService.DELIVERY_DATA);
  }

  static getTableProperties(mode: TableMode, data: FclElements): string[] {
    let properties: string[];

    if (mode === TableMode.STATIONS) {
      const additionalProps: Set<string> = new Set();

      for (const station of data.stations) {
        for (const p of station.properties) {
          additionalProps.add(p.name);
        }
      }

      properties = UtilService.getStationProperties().filter(prop => DataService.PROPERTIES.has(prop))
        .concat(Array.from(additionalProps));
    } else if (mode === TableMode.DELIVERIES) {
      const additionalProps: Set<string> = new Set();

      for (const delivery of data.deliveries) {
        for (const p of delivery.properties) {
          additionalProps.add(p.name);
        }
      }

      properties = UtilService.getDeliveryProperties().filter(prop => DataService.PROPERTIES.has(prop))
        .concat(Array.from(additionalProps));
    }

    return properties;
  }

  static openSaveDialog(url: string, fileName: string) {
    const a = document.createElement('a');

    a.style.display = 'none';
    a.target = '_blank';
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  static showErrorMessage(dialogService: MdDialog, message: string) {
    const dialogData: DialogAlertData = {
      title: 'Error',
      message: message
    };

    dialogService.open(DialogAlertComponent, {role: 'alertdialog', data: dialogData});
  }

  static setElementPosition(element: HTMLElement, x: number, y: number) {
    element.style.left = x + 'px';
    element.style.top = y + 'px';
  }

  static colorToCss(color: number[]): string {
    return 'rgb(' + color[0] + ', ' + color[1] + ', ' + color[2] + ')';
  };

  static mixColors(color1: number[], color2: number[]): number[] {
    const r = Math.round((color1[0] + color2[0]) / 2);
    const g = Math.round((color1[1] + color2[1]) / 2);
    const b = Math.round((color1[2] + color2[2]) / 2);

    return [r, g, b];
  };

  static getAllCombinations(values: any[]): any[][] {
    const n = Math.pow(2, values.length);
    const combinations = [];

    for (let i = 1; i < n; i++) {
      const bits = i.toString(2).split('').reverse().join('');
      const combination = [];

      for (let j = 0; j < values.length; j++) {
        if (bits[j] === '1') {
          combination.push(values[j]);
        }
      }

      combinations.push(combination);
    }

    combinations.sort((c1, c2) => c1.length - c2.length);

    return combinations;
  };

  static getCenter(positions: CyPosition[]): CyPosition {
    let xSum = 0;
    let ySum = 0;

    for (const pos of positions) {
      xSum += pos.x;
      ySum += pos.y;
    }

    return {
      x: xSum / positions.length,
      y: ySum / positions.length
    };
  };

  static sum(position1: CyPosition, position2: CyPosition): CyPosition {
    return {
      x: position1.x + position2.x,
      y: position1.y + position2.y
    };
  };

  static difference(position1: CyPosition, position2: CyPosition): CyPosition {
    return {
      x: position1.x - position2.x,
      y: position1.y - position2.y
    };
  };

  static stringify(value: any) {
    return typeof value === 'string' ? value : JSON.stringify(value);
  }

}
