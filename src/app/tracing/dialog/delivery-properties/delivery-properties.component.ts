import {Component, Inject} from '@angular/core';
import {
  MAT_LEGACY_DIALOG_DATA as MAT_DIALOG_DATA,
  MatLegacyDialogRef as MatDialogRef,
} from '@angular/material/legacy-dialog';
import {DeliveryData, StationData, TableColumn} from '../../data.model';
import {Constants} from '../../util/constants';
import {Utils} from '../../util/non-ui-utils';

export interface DeliveryPropertiesData {
  delivery: DeliveryData;
  source: StationData;
  target: StationData;
  originalSource: StationData;
  originalTarget: StationData;
  deliveryColumns: TableColumn[];
}

interface Property {
  label: string;
  value: string;
}

interface Properties {
  [key: string]: Property;
}

@Component({
  selector: 'fcl-delivery-properties',
  templateUrl: './delivery-properties.component.html',
  styleUrls: ['./delivery-properties.component.scss'],
})
export class DeliveryPropertiesComponent {
  otherPropertiesHidden = true;
  properties: Properties = {};

  vipProperties: string[] = [
    'id',
    'lot',
    'amount',
    'dateOut',
    'dateIn',
    'sourceName',
    'targetName',
  ];
  notListedProps: string[] = [
    'name',
    'source',
    'target',
    'originalSource',
    'originalTarget',
  ];
  otherProperties: string[] = [];

  constructor(
    public dialogRef: MatDialogRef<DeliveryPropertiesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DeliveryPropertiesData
  ) {
    this.initProperties();
  }

  getOtherPropertiesOri() {
    return this.otherProperties.map(property =>
      Object.keys(this.properties).find(
        key => this.properties[key].label === property
      )
    );
  }

  private initProperties(): void {
    const columns: TableColumn[] = this.data.deliveryColumns;
    const properties: Properties = {};
    const hiddenProps = Utils.createSimpleStringSet(this.notListedProps);
    Object.keys(this.data.delivery)
      .filter(key => Constants.PROPERTIES.has(key) && !hiddenProps[key])
      .forEach(key => {
        const column = columns.find(column => column.id === key);
        const label =
          column !== undefined
            ? column.name
            : Constants.PROPERTIES.get(key).name;
        const value = this.data.delivery[key];
        properties[key] = {
          label: label,
          value: value != null ? value + '' : '',
        };
      });

    this.data.delivery.properties.forEach(prop => {
      const column = columns.find(column => column.id === prop.name);
      const label =
        column !== undefined
          ? column.name
          : this.convertPropNameToLabel(prop.name);
      properties[prop.name] = {
        label: label,
        value: typeof prop.value === 'string' ? prop.value : prop.value + '',
      };
    });

    this.addCustomProps(properties);

    const vipProps = Utils.createSimpleStringSet(this.vipProperties);
    this.otherProperties = Object.keys(properties)
      .filter(key => !vipProps[key])
      .slice()
      .map(property => {
        const column: Property = properties[property];
        return column !== undefined
          ? column.label
          : Constants.PROPERTIES.get(property).name;
      });

    this.otherProperties.sort();
    // add default for missing props
    this.vipProperties
      .filter(key => !properties[key])
      .forEach(key => {
        const tmp = Constants.PROPERTIES.get(key);
        properties[key] = {
          label: tmp ? tmp.name : this.convertPropNameToLabel(key),
          value: '',
        };
      });
    this.properties = properties;
  }

  private addCustomProps(properties: Properties): void {
    properties['sourceId'] = {
      label: 'Source ID',
      value: this.data.delivery.source,
    };
    properties['targetId'] = {
      label: 'Target ID',
      value: this.data.delivery.target,
    };

    if (this.data.source.isMeta === true) {
      properties['originalSourceId'] = {
        label: 'Original Source ID',
        value: this.data.delivery.originalSource,
      };
      properties['originalSourceName'] = {
        label: 'Original Source',
        value: this.data.originalSource.name ?? '',
      };
    }

    if (this.data.target.isMeta === true) {
      properties['originalTargetId'] = {
        label: 'Original Target ID',
        value: this.data.delivery.originalTarget,
      };
      properties['originalTargetName'] = {
        label: 'Original Target',
        value: this.data.originalTarget.name ?? '',
      };
    }

    properties['sourceName'] = {
      label: 'Source',
      value: this.data.source.name ?? '',
    };
    properties['targetName'] = {
      label: 'Target',
      value: this.data.target.name ?? '',
    };
  }

  private capitelizeFirstLetter(str: string): string {
    return str && str.length > 0
      ? str.charAt(0).toUpperCase() + str.slice(1)
      : str;
  }

  private decamelize(str: string): string {
    const separator = ' ';
    return str
      .replace(/([a-z\d])([A-Z])/g, '$1' + separator + '$2')
      .replace(/([A-Z]+)([A-Z][a-z\d]+)/g, '$1' + separator + '$2');
  }

  private convertPropNameToLabel(str: string): string {
    return this.capitelizeFirstLetter(this.decamelize(str));
  }

  toggleOtherProperties() {
    this.otherPropertiesHidden = !this.otherPropertiesHidden;
  }
}
