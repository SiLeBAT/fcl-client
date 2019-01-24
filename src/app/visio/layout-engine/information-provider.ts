import * as _ from 'lodash';
import { VisioGraph, VisioBox, VisioReporter, StationInformation, LotInformation,
    StationGrouper, InformationGraph, ProductInformation, DeliveryInformation } from './datatypes';
import { FclElements, StationData, DeliveryData } from './../../util/datatypes';

export class InformationProvider {
    private static readonly UNKNOWN = 'unkown';
    private lotCounter: number = 0;

    private idToDeliveryMap: Map<string, DeliveryData>;
    private stationIdToInfoMap: Map<string, StationInformation>;
    private deliveryToSourceMap: Map<DeliveryInformation, LotInformation>;
    private deliveries: DeliveryInformation[];

    constructor(private data: FclElements) {
        this.idToDeliveryMap = new Map();
        data.deliveries.forEach((d) => this.idToDeliveryMap.set(d.id, d));
        this.stationIdToInfoMap = new Map();
        this.deliveryToSourceMap = new Map();
        this.deliveries = [];
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
                    lot => lot.deliveries.forEach(
                        delivery => {
                            this.deliveryToSourceMap.set(delivery, lot);
                        }
                    )
                )
            );
        }
        return this.stationIdToInfoMap.get(station.id);
    }

    groupDeliveries(deliveries: DeliveryData[], keyFn: (d: DeliveryData) => string): Map<string, DeliveryData[]> {
        const result: Map<string, DeliveryData[]> = new Map();
        deliveries.forEach(d => {
            const key: string = keyFn(d);
            if (result.has(key)) {
                result.get(key).push(d);
            } else {
                result.set(key, [d]);
            }
        });
        return result;
    }

    private createProductInformation(deliveries: DeliveryData[]): ProductInformation[] {
        return Array.from(this.groupDeliveries(deliveries, d => d.name)).map(([productKey, productDeliveries]) => ({
            id: null,
            name: productKey,
            lots: this.createLotInformation(productDeliveries)
        }));
    }

    private createLotInformation(deliveries: DeliveryData[]): LotInformation[] {
        return Array.from(this.groupDeliveries(deliveries, d => d.lot)).map(([lotKey, lotDeliveries]) => ({
            id: 'L' + this.lotCounter++,
            lot: lotKey,
            lotIdentifier: lotKey,
            productionOrDurabilityDate: InformationProvider.UNKNOWN,
            product: lotDeliveries[0].name,
            commonProductName: lotDeliveries[0].name,
            brandName: InformationProvider.UNKNOWN,
            production: null,
            quantity: InformationProvider.UNKNOWN,
            samples: [],
            deliveries: lotDeliveries.map(d => this.createDeliveryInformation(d))
        }));
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
