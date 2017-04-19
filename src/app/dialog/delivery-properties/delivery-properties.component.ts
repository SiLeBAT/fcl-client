import {Component, Inject} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';
import {DeliveryData} from '../../util/datatypes';

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
    this.properties = Object.keys(data.delivery).map(key => {
      const value = data.delivery[key];

      return {
        name: key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      };
    });
  }

}
