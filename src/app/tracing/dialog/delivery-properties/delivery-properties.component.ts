import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { DeliveryData, StationData } from '../../data.model';
import { Constants } from '../../util/constants';
import { Utils } from '../../util/non-ui-utils';

export interface DeliveryPropertiesData {
    delivery: DeliveryData;
    source: StationData;
    target: StationData;
    originalSource: StationData;
    originalTarget: StationData;
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
    styleUrls: ['./delivery-properties.component.scss']
})
export class DeliveryPropertiesComponent implements OnInit {

    otherPropertiesHidden = true;
    properties: Properties = {};

    vipProperties: string[] = ['id', 'lot', 'score', 'sourceName', 'targetName', 'sourceId', 'targetId', 'weight', 'crossContamination', 'killContamination', 'observed', 'forward', 'backward'];
    notListedProps: string[] = ['name', 'source', 'target', 'originalSource', 'originalTarget'];
    otherProperties: string[] = [];

    constructor(public dialogRef: MatDialogRef<DeliveryPropertiesComponent>, @Inject(MAT_DIALOG_DATA) public data: DeliveryPropertiesData) {
        this.initProperties();
    }

    private initProperties(): void {
        const properties: Properties = {};
        const hiddenProps = Utils.createSimpleStringSet(this.notListedProps);
        Object.keys(this.data.delivery).filter(key => Constants.PROPERTIES.has(key) && !hiddenProps[key])
        .forEach(key => {
            const value = this.data.delivery[key];
            properties[key] = {
                label: Constants.PROPERTIES.get(key).name,
                value: value != null ? value + '' : ''
            };
        });

        this.data.delivery.properties.forEach(prop => {
            properties[prop.name] = {
                label: this.convertPropNameToLabel(prop.name),
                value: typeof prop.value === 'string' ? prop.value : prop.value + ''
            };
        });

        this.addCustomProps(properties);

        const vipProps = Utils.createSimpleStringSet(this.vipProperties);
        this.otherProperties = Object.keys(properties).filter(key => !vipProps[key]).slice();
        this.otherProperties.sort();
        // add default for missing props
        this.vipProperties.filter(key => !properties[key]).forEach(key => {
            const tmp = Constants.PROPERTIES.get(key);
            properties[key] = {
                label: tmp ? tmp.name : this.convertPropNameToLabel(key),
                value: ''
            };
        });
        this.properties = properties;
    }

    private addCustomProps(properties: Properties): void {
        properties['sourceId'] = {
            label: 'Source ID',
            value: this.data.delivery.source
        };
        properties['targetId'] = {
            label: 'Target ID',
            value: this.data.delivery.target
        };
        properties['originalSourceId'] = {
            label: 'Original Source ID',
            value: this.data.delivery.originalSource
        };
        properties['originalTargetId'] = {
            label: 'Original Target ID',
            value: this.data.delivery.originalTarget
        };

        properties['sourceName'] = {
            label: 'Source Name',
            value: this.data.source.name
        };
        properties['targetName'] = {
            label: 'Target Name',
            value: this.data.target.name
        };
        properties['originalSourceName'] = {
            label: 'Original Source Name',
            value: this.data.originalSource.name
        };
        properties['originalTargetName'] = {
            label: 'Original Target Name',
            value: this.data.originalTarget.name
        };
    }

    private capitelizeFirstLetter(str: string): string {
        return str && str.length > 0 ? str.charAt(0).toUpperCase() + str.slice(1) : str;
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

    ngOnInit() {
    }

}
