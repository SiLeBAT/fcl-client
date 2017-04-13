import {Subject} from 'rxjs/Rx';
import {DataService} from '../util/data.service';

export function Legend(params: Subject<string[]>) {
  return new LegendClass(this, params);
}

class LegendClass {

  private container: HTMLElement;
  private legendDiv: HTMLElement;

  constructor(cy: any, params: Subject<string[]>) {
    this.container = cy.container();
    params.subscribe(properties => this.update(properties));
  }

  private update(properties: string[]) {
    if (this.legendDiv != null) {
      this.legendDiv.remove();
    }

    if (properties.length > 0) {
      const table = document.createElement('table');

      for (const prop of properties) {
        const propValue = DataService.PROPERTIES.get(prop);
        const row = document.createElement('tr');
        const labelCell = document.createElement('td');
        const colorCell = document.createElement('td');
        const colorCellDiv = document.createElement('div');

        labelCell.innerText = propValue.name;
        colorCellDiv.style.backgroundColor = 'rgb(' + propValue.color.join(', ') + ')';
        colorCell.appendChild(colorCellDiv);
        row.appendChild(labelCell);
        row.appendChild(colorCell);
        table.appendChild(row);
      }

      this.legendDiv = document.createElement('div');
      this.legendDiv.appendChild(table);
      this.legendDiv.id = 'cy-legend';
      this.legendDiv.onmousedown = e => e.stopPropagation();
      this.legendDiv.ontouchstart = e => e.stopPropagation();
      this.container.appendChild(this.legendDiv);
    }
  }
}
