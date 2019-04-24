import * as _ from 'lodash';
import { StationInformation, LotInformation,
     ProductInformation, DeliveryInformation } from './datatypes';
import { FclElements, StationData, DeliveryData } from './../../util/datatypes';
import { Utils } from './../../util/utils';
import { addSampleInformation } from './sample-information-provider';

export class InformationProvider {
    private static readonly STATION_PROPERTY_ACTIVITY = 'focusStationChain';
    private static readonly DELIVERY_PROPERTY_BRANDNAME = 'brandName';
    private static readonly DELIVERY_PROPERTY_LOTQUANTITY = 'lotQuantity';
    private static readonly UNKNOWN = 'unkown';
    private lotCounter: number = 0;

    private idToDeliveryMap: Map<string, DeliveryData>;
    private stationIdToInfoMap: Map<string, StationInformation>;
    private idToLotMap: Map<string, LotInformation>;
    private deliveryToSourceMap: Map<DeliveryInformation, LotInformation>;
    private deliveries: DeliveryInformation[];

    constructor(private data: FclElements) {
        this.idToDeliveryMap = new Map();
        data.deliveries.forEach((d) => this.idToDeliveryMap.set(d.id, d));
        this.stationIdToInfoMap = new Map();
        this.idToLotMap = new Map();
        this.deliveryToSourceMap = new Map();
        this.deliveries = [];
        this.init();
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

        addSampleInformation(Array.from(this.stationIdToInfoMap.values()), this.data.samples);
    }

    private createStationInfo(station: StationData): StationInformation {
        const stationInfo = {
            id: station.id,
            data: station,
            ctno: null,
            name: station.name,
            registrationNumber: null,
            sector: null,
            activities: this.getProperty(station.properties, InformationProvider.STATION_PROPERTY_ACTIVITY),
            samples: [],
            inSamples: [],
            products: this.createProductInformation(this.getStationOutDeliveries(station))
        };
        return stationInfo;
    }

    private getProperty(propList: {name: string, value: string}[], propName: string): string {
        const index: number = propList.findIndex((p) => p.name.localeCompare(propName) === 0);
        if (index >= 0) {
            return propList[index].value;
        } else {
            return null;
        }
    }

    private createProductInformation(deliveries: DeliveryData[]): ProductInformation[] {
        const productToDeliveriesMap = Utils.getGroups(deliveries, (d) => d.name);
        return Array.from(productToDeliveriesMap).map(([, productDeliveries]) => ({
            id: null,
            name: productDeliveries[0].name,
            lots: this.createLotInformation(productDeliveries)
        }));
    }

    private createLotInformation(deliveries: DeliveryData[]): LotInformation[] {
        const lotToDeliveriesMap = Utils.getGroups(deliveries, (d) => d.lot);
        return Array.from(lotToDeliveriesMap).map(([, lotDeliveries]) => ({
            id: 'L' + this.lotCounter++,
            lot: lotDeliveries[0].lot,
            key: lotDeliveries[0].lotKey,
            lotIdentifier: lotDeliveries[0].lot,
            productionOrDurabilityDate: InformationProvider.UNKNOWN,
            product: lotDeliveries[0].name,
            commonProductName: lotDeliveries[0].name,
            brandName: this.getProperty(lotDeliveries[0].properties, InformationProvider.DELIVERY_PROPERTY_BRANDNAME),
            production: null,
            quantity: this.getProperty(lotDeliveries[0].properties, InformationProvider.DELIVERY_PROPERTY_LOTQUANTITY),
            samples: [],
            deliveries: lotDeliveries.map(d => this.createDeliveryInformation(d))
        }));
    }

    private getStationOutDeliveries(station: StationData): DeliveryData[] {
        return station.outgoing.map(delId => this.idToDeliveryMap.get(delId)).filter(d => !d.invisible);
    }

    getStationInfo(station: StationData): StationInformation {
        if (!this.stationIdToInfoMap.has(station.id)) {
            const stationInfo = {
                id: station.id,
                data: station,
                ctno: null,
                name: station.name,
                registrationNumber: null,
                sector: null,
                activities: null,
                samples: [],
                inSamples: [],
                products: this.createProductInformation(
                    station.outgoing.map(delId => this.idToDeliveryMap.get(delId)).filter(d => !d.invisible)
                )
            };
            this.stationIdToInfoMap.set(station.id, stationInfo);
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
        }
        return this.stationIdToInfoMap.get(station.id);
    }

    getLotInfo(id: string): LotInformation {
        return this.idToLotMap.get(id);
    }

    createDeliveryInformation(delivery: DeliveryData): DeliveryInformation {
        return {
            forward: delivery.forward,
            backward: delivery.backward,
            date: delivery.date,
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
