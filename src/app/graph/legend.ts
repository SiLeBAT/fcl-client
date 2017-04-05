import {Subject} from 'rxjs/Rx';
import {DataService} from '../util/data.service';

export function Legend(params: Subject<Set<string>>) {
  return new LegendClass(this, params);
}

class LegendClass {

  private container: HTMLElement;
  private legendDiv: HTMLElement;

  constructor(cy: any, params: Subject<Set<string>>) {
    this.container = cy.container();
    params.subscribe(properties => this.update(properties));
  }

  private update(properties: Set<string>) {
    if (this.legendDiv != null) {
      this.legendDiv.remove();
    }

    if (properties.size > 0) {
      const table = document.createElement('table');

      DataService.PROPERTIES.forEach((value, key) => {
        if (properties.has(key)) {
          const row = document.createElement('tr');
          const labelCell = document.createElement('td');
          const colorCell = document.createElement('td');
          const colorCellDiv = document.createElement('div');

          labelCell.innerText = value.name;
          colorCellDiv.style.backgroundColor = 'rgb(' + value.color.join(', ') + ')';
          colorCell.appendChild(colorCellDiv);
          row.appendChild(labelCell);
          row.appendChild(colorCell);
          table.appendChild(row);
        }
      });

      this.legendDiv = document.createElement('div');
      this.legendDiv.appendChild(table);
      this.legendDiv.id = 'cy-legend';
      this.legendDiv.onmousedown = e => e.stopPropagation();
      this.legendDiv.ontouchstart = e => e.stopPropagation();
      this.container.appendChild(this.legendDiv);
    }
  }
}
