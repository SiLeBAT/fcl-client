import {Component, Inject} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';

export interface StationPropertiesData {
  station: any;
}

@Component({
  templateUrl: './station-properties.component.html',
  styleUrls: ['./station-properties.component.css']
})
export class StationPropertiesComponent {

  properties: { name: string, value: string }[];

  constructor(@Inject(MD_DIALOG_DATA) public data: StationPropertiesData) {
    this.properties = Object.keys(data.station.data).map(key => {
      const value = data.station.data[key];

      return {
        name: key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      };
    });
  }

}
