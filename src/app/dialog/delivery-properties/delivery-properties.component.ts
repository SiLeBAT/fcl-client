import {Component, Inject, OnInit} from '@angular/core';
import {MD_DIALOG_DATA, MdDialogRef} from '@angular/material';
import {DeliveryData, DialogAlignment} from '../../util/datatypes';
import {Constants} from '../../util/constants';
import {Utils} from '../../util/utils';

export interface DeliveryPropertiesData {
  delivery: DeliveryData;
}

@Component({
  selector: 'app-delivery-properties',
  templateUrl: './delivery-properties.component.html',
  styleUrls: ['./delivery-properties.component.css']
})
export class DeliveryPropertiesComponent implements OnInit {

  title: string;
  properties: { name: string, value: string }[];

  private dialogAlign = DialogAlignment.CENTER;

  constructor(public dialogRef: MdDialogRef<DeliveryPropertiesComponent>, @Inject(MD_DIALOG_DATA) public data: DeliveryPropertiesData) {
    this.title = data.delivery.name;
    this.properties = Object.keys(data.delivery)
      .filter(key => Constants.PROPERTIES.has(key) && key !== 'name')
      .map(key => {
        const value = data.delivery[key];

        return {
          name: Constants.PROPERTIES.get(key).name,
          value: value != null ? String(value) : ''
        };
      }).concat(data.delivery.properties.map(prop => {
        return {
          name: '"' + prop.name + '"',
          value: prop.value != null ? prop.value : ''
        };
      }));
  }

  ngOnInit() {
    this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
  }

  moveLeft() {
    this.dialogAlign = this.dialogAlign === DialogAlignment.RIGHT ? DialogAlignment.CENTER : DialogAlignment.LEFT;
    this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
  }

  moveRight() {
    this.dialogAlign = this.dialogAlign === DialogAlignment.LEFT ? DialogAlignment.CENTER : DialogAlignment.RIGHT;
    this.dialogRef.updatePosition(Utils.getDialogPosition(this.dialogAlign));
  }

}
