import {Subject} from 'rxjs/Rx';
import {DataService} from '../util/data.service';

export function Legend(params: Subject<Set<string>>) {
  return new LegendClass(this.container(), params);
}

class LegendClass {

  private container: HTMLElement;
  private legendDiv: HTMLElement;

  constructor(container: HTMLElement, params: Subject<Set<string>>) {
    this.container = container;
    params.subscribe(properties => this.update(properties));
  }

  private update(properties: Set<string>) {
    const table = document.createElement('table');

    DataService.PROPERTIES.forEach((value, key) => {
      if (properties.has(key)) {
        const row = document.createElement('tr');
        const rowLabel = document.createElement('td');
        const rowColor = document.createElement('td');

        rowLabel.innerText = value.name;
        rowColor.style.backgroundColor = 'rgb(' + value.color.join(', ') + ')';
        rowColor.width = '20px';
        rowColor.height = '100%';
        row.appendChild(rowLabel);
        row.appendChild(rowColor);
        table.appendChild(row);
      }
    });

    if (this.legendDiv != null) {
      this.legendDiv.remove();
    }

    this.legendDiv = document.createElement('div');
    this.legendDiv.appendChild(table);
    this.legendDiv.id = 'cy-legend';
    this.legendDiv.style.position = 'absolute';
    this.legendDiv.style.left = '0';
    this.legendDiv.style.bottom = '0';
    this.legendDiv.style.backgroundColor = 'rgb(200, 200, 200)';
    this.container.appendChild(this.legendDiv);
  }
}
