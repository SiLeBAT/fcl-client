import {Subject} from 'rxjs/Rx';

export class Legend {

  constructor(params: Subject<string>) {
    params.subscribe(s => console.log(s));

    const mainDiv = document.createElement('div');

    const table = document.createElement('table');

    const observed = document.createElement('tr');

    const observedLabel = document.createElement('td');

    observedLabel.innerText = 'Observed';

    const observedColor = document.createElement('td');

    observedColor.style.backgroundColor = 'rgb(0, 0, 255)';
    observedColor.width = '20px';
    observedColor.height = '100%';

    observed.appendChild(observedLabel);
    observed.appendChild(observedColor);

    table.appendChild(observed);

    mainDiv.appendChild(table);
    mainDiv.id = 'cy-legend';
    mainDiv.style.position = 'absolute';
    mainDiv.style.left = '0';
    mainDiv.style.bottom = '0';
    mainDiv.style.backgroundColor = 'rgb(200, 200, 200)';

    this['container']().appendChild(mainDiv);
  }
}
