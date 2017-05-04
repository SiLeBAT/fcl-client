import {Component, Inject} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';
import {DeliveryData} from '../../util/datatypes';
import {DataService} from '../../util/data.service';

export interface DeliveryPropertiesData {
  delivery: DeliveryData;
}

@Component({
  templateUrl: './delivery-properties.component.html',
  styleUrls: ['./delivery-properties.component.css']
})
export class DeliveryPropertiesComponent {

  properties: { name: string, value: string }[];

  constructor(@Inject(MD_DIALOG_DATA) public data: DeliveryPropertiesData) {
    this.properties = Object.keys(data.delivery).filter(key => DataService.PROPERTIES.has(key)).map(key => {
      const value = data.delivery[key];

      return {
        name: DataService.PROPERTIES.get(key).name,
        value: value != null ? String(value) : ''
      };
    }).concat(data.delivery.properties.map(prop => {
      return {
        name: prop.name,
        value: prop.value != null ? prop.value : ''
      };
    }));
  }

}
