import {Color, DeliveryData, DialogAlignment, FclElements, Position, StationData, TableMode} from './datatypes';
import {DialogPosition, MatDialog, MatDialogRef, MatMenuTrigger} from '@angular/material';
import * as ol from 'openlayers';
import {DialogAlertComponent, DialogAlertData} from '../dialog/dialog-alert/dialog-alert.component';
import {Constants} from './constants';
import {ElementRef} from '@angular/core';

export class Utils {

  private static CY_TO_OL_FACTOR = 10000;

  static latLonToPosition(lat: number, lon: number, zoom: number): Position {
    const p = ol.proj.fromLonLat([lon, lat]);

    return {
      x: p[0] / Utils.CY_TO_OL_FACTOR * zoom,
      y: -p[1] / Utils.CY_TO_OL_FACTOR * zoom
    };
  }

  static panZoomToView(pan: Position, zoom: number, width: number, height: number): ol.View {
    return new ol.View({
      center: [(width / 2 - pan.x) / zoom * Utils.CY_TO_OL_FACTOR, -(height / 2 - pan.y) / zoom * Utils.CY_TO_OL_FACTOR],
      resolution: Utils.CY_TO_OL_FACTOR / zoom
    });
  }

  static getDialogPosition(alignment: DialogAlignment): DialogPosition {
    switch (alignment) {
      case DialogAlignment.LEFT:
        return {left: '0px'};
      case DialogAlignment.CENTER:
        return {};
      case DialogAlignment.RIGHT:
        return {right: '0px'};
    }

    return null;
  }

  static getTableElements(mode: TableMode, data: FclElements): (StationData | DeliveryData)[] {
    if (mode === TableMode.STATIONS) {
      return data.stations;
    } else if (mode === TableMode.DELIVERIES) {
      return data.deliveries;
    }

    return null;
  }

  static getTableProperties(mode: TableMode, stationColumns: string[], deliveryColumns: string[]): string[] {
    if (mode === TableMode.STATIONS) {
      return stationColumns;
    } else if (mode === TableMode.DELIVERIES) {
      return deliveryColumns;
    }

    return null;
  }

  static getAllTableProperties(mode: TableMode, data: FclElements): string[] {
    let properties: string[];

    if (mode === TableMode.STATIONS) {
      properties = Constants.STATION_PROPERTIES.toArray();
    } else if (mode === TableMode.DELIVERIES) {
      properties = Constants.DELIVERY_PROPERTIES.toArray();
    }

    const additionalProps: Set<string> = new Set();

    for (const element of Utils.getTableElements(mode, data)) {
      for (const p of element.properties) {
        additionalProps.add(p.name);
      }
    }

    return properties.filter(prop => Constants.PROPERTIES.has(prop)).concat(Array.from(additionalProps));
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

  static showErrorMessage(dialogService: MatDialog, message: string): MatDialogRef<any> {
    const dialogData: DialogAlertData = {
      title: 'Error',
      message: message
    };

    return dialogService.open(DialogAlertComponent, {role: 'alertdialog', data: dialogData});
  }

  static openMenu(trigger: MatMenuTrigger, triggerElement: ElementRef, pos: Position) {
    const style = (<HTMLElement>triggerElement.nativeElement).style;

    style.position = 'fixed';
    style.left = pos.x + 'px';
    style.top = pos.y + 'px';
    trigger.openMenu();
  }

  static colorToCss(color: Color): string {
    return 'rgb(' + color.r + ', ' + color.g + ', ' + color.b + ')';
  }

  static mixColors(color1: Color, color2: Color): Color {
    return {
      r: Math.round((color1.r + color2.r) / 2),
      g: Math.round((color1.g + color2.g) / 2),
      b: Math.round((color1.b + color2.b) / 2)
    };
  }

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
  }

  static getCenter(positions: Position[]): Position {
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
  }

  static sum(position1: Position, position2: Position): Position {
    return {
      x: position1.x + position2.x,
      y: position1.y + position2.y
    };
  }

  static difference(position1: Position, position2: Position): Position {
    return {
      x: position1.x - position2.x,
      y: position1.y - position2.y
    };
  }

  static stringToDate(dateString: string): Date {
    if (dateString != null) {
      const date = new Date(dateString);

      if (isNaN(date.getTime())) {
        throw new SyntaxError('Invalid date: ' + dateString);
      } else {
        return date;
      }
    } else {
      return null;
    }
  }

  static dateToString(date: Date): string {
    if (date != null) {
      const isoString = date.toISOString();

      return isoString.substring(0, isoString.indexOf('T'));
    } else {
      return null;
    }
  }

  static getMatrix<T>(rowCount: number, columnCount: number, value: T): T[][] {
      const result: T[][] = [];
      for (let r = rowCount - 1; r >= 0; r--) {
          result[r] = new Array<T>(columnCount).fill(value);
      }
      return result;
  }

  static replaceAll(text: string, find: string, replace: string) {
    return text.replace(new RegExp(find, 'g'), replace);
  }
}
