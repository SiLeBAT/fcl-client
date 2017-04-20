import {Injectable} from '@angular/core';
import {CyPosition} from './datatypes';

@Injectable()
export class UtilService {

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

}
