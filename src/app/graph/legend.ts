import {Subject} from 'rxjs/Rx';

export function Legend(params: Subject<string>) {
  params.subscribe(s => console.log(s));

  const mainDiv = document.createElement('div');

  mainDiv.id = 'cy-legend';
  mainDiv.style.position = 'absolute';
  mainDiv.style.left = '0%';
  mainDiv.style.bottom = '0%';
  mainDiv.style.width = '100px';
  mainDiv.style.height = '100px';
  mainDiv.style.backgroundColor = 'rgb(0, 0, 0)';

  this.container().appendChild(mainDiv);

  return this;
}
