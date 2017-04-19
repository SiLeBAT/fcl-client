import {Component, Inject} from '@angular/core';
import {MD_DIALOG_DATA} from '@angular/material';

export interface DeliveryPropertiesData {
  delivery: any;
}

@Component({
  templateUrl: './delivery-properties.component.html',
  styleUrls: ['./delivery-properties.component.css']
})
export class DeliveryPropertiesComponent {

  properties: { name: string, value: string }[];

  constructor(@Inject(MD_DIALOG_DATA) public data: DeliveryPropertiesData) {
    this.properties = Object.keys(data.delivery.data).map(key => {
      const value = data.delivery.data[key];

      return {
        name: key,
        value: typeof value === 'string' ? value : JSON.stringify(value)
      };
    });
  }

}
