import * as _ from 'lodash';
import {
    StationInformation, LotInformation, ProductInformation, DeliveryInformation
} from './datatypes';
import { StationData, DeliveryData, SampleData, PropertyEntry } from '../../data.model';
import { Utils } from '../../util/non-ui-utils';
import { addSampleInformation } from './sample-information-provider';
import { LabelElementInfo, PropElementInfo, ROASettings } from '../model';

interface FclElements {
    stations: StationData[];
    deliveries: DeliveryData[];
    samples: SampleData[];
}

interface VIProps {
    stationProps: string[];
    lotProps: string[];
    sampleProps: string[];
}

export class InformationProvider {
    private static readonly STATION_PROPERTY_ACTIVITY = 'typeOfBusiness';

    private lotCounter: number = 0;

    private idToDeliveryMap: Map<string, DeliveryData>;
    private idToStationMap: Map<string, StationData>;
    private stationIdToInfoMap: Map<string, StationInformation>;
    private idToLotMap: Map<string, LotInformation>;
    private deliveryToSourceMap: Map<DeliveryInformation, LotInformation>;
    private viProps: VIProps;

    constructor(private data: FclElements, roaSettings: ROASettings) {
        this.idToStationMap = new Map();
        data.stations.forEach((s) => this.idToStationMap.set(s.id, s));
        this.idToDeliveryMap = new Map();
        data.deliveries.forEach((d) => this.idToDeliveryMap.set(d.id, d));
        this.stationIdToInfoMap = new Map();
        this.idToLotMap = new Map();
        this.deliveryToSourceMap = new Map();
        this.viProps = this.getVIProps(roaSettings);

        this.init();
    }

    private getVIProps(roaSettings: ROASettings): VIProps {
        return {
            stationProps: this.getLabelProps(roaSettings.labelSettings.stationLabel),
            lotProps: this.getLabelProps(roaSettings.labelSettings.lotLabel),
            sampleProps: _.uniq([].concat(
                this.getLabelProps(roaSettings.labelSettings.lotSampleLabel),
                this.getLabelProps(roaSettings.labelSettings.stationSampleLabel)
            ))
        };
    }

    private getLabelProps(labelElements: LabelElementInfo[][]): string[] {
        return [].concat(...labelElements.map(
            elementRow => elementRow.filter(e => (e as PropElementInfo).prop !== undefined).map(e => (e as PropElementInfo).prop)
        ));
    }

    private init() {
        const stations = this.data.stations.filter(station => !station.invisible && !station.contained);

        this.stationIdToInfoMap = new Map();
        stations.forEach(station => {
            const stationInfo = this.createStationInfo(station);
            this.stationIdToInfoMap.set(stationInfo.id, stationInfo);
            stationInfo.products.forEach(
                product => product.lots.forEach(
                    lot => {
                        lot.deliveries.forEach(
                            delivery => {
                                this.deliveryToSourceMap.set(delivery, lot);
                            }
                        );
                        this.idToLotMap.set(lot.id, lot);
                    }
                )
            );
        });

        addSampleInformation(Array.from(this.stationIdToInfoMap.values()), this.data.samples, this.viProps.sampleProps);
    }

    private createStationInfo(station: StationData): StationInformation {
        const stationInfo = {
            id: station.id,
            data: station,
            ctno: null,
            props: this.getProps(station, this.viProps.stationProps),
            activities: this.getProperty(station.properties, InformationProvider.STATION_PROPERTY_ACTIVITY),
            samples: [],
            inSamples: [],
            products: this.createProductInformation(this.getStationOutDeliveries(station))
        };
        return stationInfo;
    }

    private getProps(dataObj: {}, properties: string[]): { [key: string]: string | number | boolean } {
        const propsObj = {};
        for (const prop of properties) {
            propsObj[prop] = this.getPropValue(dataObj, prop);
        }
        return propsObj;
    }

    private getPropValue(dataObj: { properties?: {name: string, value: string}[] }, prop: string): string | number | boolean {
        let value = dataObj[prop];

        if (value === undefined && dataObj.properties) {
            const propertyIndex = dataObj.properties.findIndex(property => property.name === prop);
            if (propertyIndex >= 0) {
                value = dataObj.properties[propertyIndex].value;

            }
        }

        return value;
    }

    // private getProperty(propList: PropertyEntry[], propName: string): string {
    private getProperty(propList: PropertyEntry[], propName: string): string | null {
        const index: number = propList.findIndex((p) => p.name.localeCompare(propName) === 0);
        if (index >= 0) {
            const value = propList[index].value;
            return value + '';
        } else {
            return null;
        }
    }

    private createProductInformation(deliveries: DeliveryData[]): ProductInformation[] {
        const productToDeliveriesMap = Utils.getGroups(deliveries, (d) => d.name);
        return Array.from(productToDeliveriesMap).map(([, productDeliveries]) => ({
            id: null,
            lots: this.createLotInformation(productDeliveries)
        }));
    }

    private createLotInformation(deliveries: DeliveryData[]): LotInformation[] {
        const lotToDeliveriesMap = Utils.getGroups(deliveries, (d) => d.lot);
        return Array.from(lotToDeliveriesMap).map(([, lotDeliveries]) => ({
            id: 'L' + this.lotCounter++,
            props: this.getProps(lotDeliveries[0], this.viProps.lotProps),
            key: lotDeliveries[0].lotKey,
            samples: [],
            deliveries: lotDeliveries.map(d => this.createDeliveryInformation(d))
        }));
    }

    private getStationOutDeliveries(station: StationData): DeliveryData[] {
        return station.outgoing.map(
            delId => this.idToDeliveryMap.get(delId)
        ).filter(
            d =>
                !d.invisible &&
            !this.idToStationMap.get(d.source).invisible &&
            !this.idToStationMap.get(d.target).invisible
        );
    }

    getStationInfo(station: StationData): StationInformation {
        return this.stationIdToInfoMap.get(station.id);
    }

    getLotInfo(id: string): LotInformation {
        return this.idToLotMap.get(id);
    }

    createDeliveryInformation(delivery: DeliveryData): DeliveryInformation {
        return {
            forward: delivery.forward,
            backward: delivery.backward,
            date: delivery.dateOut,
            target: delivery.target // consider to take another id system
        };
    }

    getDeliveries(): DeliveryInformation[] {
        return Array.from(this.deliveryToSourceMap.keys()).slice();
    }

    getDeliverySource(deliveryInfo: DeliveryInformation): LotInformation {
        return this.deliveryToSourceMap.get(deliveryInfo);
    }

    getDeliveryTarget(deliveryInfo: DeliveryInformation): StationInformation {
        return this.stationIdToInfoMap.get(deliveryInfo.target);
    }

    compressInformation() {

    }
}
