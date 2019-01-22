import * as _ from 'lodash';
import {VisioGraph, VisioContainer, VisioBox, VisioReporter, StationInformation, LotInformation,
    StationGrouper, InformationGraph, ProductInformation, DeliveryInformation} from './datatypes';
import {FclElements, StationData, DeliveryData} from './../../util/datatypes';

export class InformationProvider {
    private static readonly UNKNOWN = 'unkown';

    private idToDeliveryMap: Map<string, DeliveryData>;

    constructor(private data: FclElements) {
        this.idToDeliveryMap = new Map();
        data.deliveries.forEach((d) => this.idToDeliveryMap.set(d.id, d));
    }

    getStationInfo(station: StationData): StationInformation {
        return {
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
            // lots: this.createLotInformation(station.outgoing.map(delId => this.idToDeliveryMap.get(delId)).filter(d => !d.invisible))
        };
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

    createProductInformation(deliveries: DeliveryData[]): ProductInformation[] {
        return Array.from(this.groupDeliveries(deliveries, d => d.name)).map(([productKey, productDeliveries]) => ({
            id: null,
            name: productKey,
            lots: this.createLotInformation(productDeliveries)
        }));
    }

    createLotInformation(deliveries: DeliveryData[]): LotInformation[] {
        return Array.from(this.groupDeliveries(deliveries, d => d.lot)).map(([lotKey, lotDeliveries]) => ({
            id: null,
            lot: lotKey,
            lotIdentifier: lotKey,
            productionOrDurabilityDate: InformationProvider.UNKNOWN,
            product: lotDeliveries[0].name,
            commonProductName: lotDeliveries[0].name,
            brandName: InformationProvider.UNKNOWN,
            production: null,
            quantity: InformationProvider.UNKNOWN,
            samples: [],
            deliveries: []
        }));
    }

    createDeliveryInformation(delivery: DeliveryData): DeliveryInformation {
        return null;
    }


}


/*export function createInformationGraph(data: FclElements, grouper: StationGrouper): InformationGraph {
    const groups: Map<string, StationData[]> = grouper.groupStations(data.stations.filter(s => !s.invisible));

    const infoProvider: InformationProvider = new InformationProvider(data);

    return {
        groups: Array.from(groups).map(([label, stations]) => ({
            label: label,
            stations: stations.map(s => infoProvider.createStationInformation(s))
        }))
    };
}*/
