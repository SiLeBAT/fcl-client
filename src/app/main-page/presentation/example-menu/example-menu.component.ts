import {Component, ViewChild, Input, Output, EventEmitter} from '@angular/core';
import {MatLegacyMenu as MatMenu} from '@angular/material/legacy-menu';
import {ExampleData} from '../../model/types';

@Component({
  selector: 'fcl-example-menu',
  templateUrl: './example-menu.component.html',
})
export class ExampleMenuComponent {
  @ViewChild('exampleDataMenu', {static: true}) exampleDataMenu: MatMenu;
  @Input() exampleData: ExampleData[];
  @Output() loadExampleDataFile: EventEmitter<ExampleData> = new EventEmitter();

  onLoadExampleDataFile(exampleData: ExampleData) {
    this.loadExampleDataFile.emit(exampleData);
  }
}
