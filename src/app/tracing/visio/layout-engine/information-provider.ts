import * as _ from "lodash";
import {
    StationInformation,
    LotInformation,
    ProductInformation,
    DeliveryInformation,
} from "./datatypes";
import {
    StationData,
    DeliveryData,
    SampleData,
    PropertyEntry,
} from "../../data.model";
import { concat, removeNullish, Utils } from "../../util/non-ui-utils";
import { addSampleInformation } from "./sample-information-provider";
import { LabelElementInfo, PropElementInfo, ROASettings } from "../model";

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
    private static readonly STATION_PROPERTY_ACTIVITY = "typeOfBusiness";

    private lotCounter: number = 0;
    private prodCounter: number = 0;

    private idToDeliveryMap: Map<string, DeliveryData>;
    private idToStationMap: Map<string, StationData>;
    private stationIdToInfoMap: Map<string, StationInformation>;
    private idToLotMap: Map<string, LotInformation>;
    private deliveryToSourceMap: Map<DeliveryInformation, LotInformation>;
    private viProps: VIProps;

    constructor(
        private data: FclElements,
        roaSettings: ROASettings,
    ) {
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
            stationProps: this.getLabelProps(
                roaSettings.labelSettings.stationLabel,
            ),
            lotProps: this.getLabelProps(roaSettings.labelSettings.lotLabel),
            sampleProps: _.uniq(
                concat(
                    this.getLabelProps(
                        roaSettings.labelSettings.lotSampleLabel,
                    ),
                    this.getLabelProps(
                        roaSettings.labelSettings.stationSampleLabel,
                    ),
                ),
            ),
        };
    }

    private getLabelProps(labelElements: LabelElementInfo[][]): string[] {
        const props = labelElements.map((elementRow) =>
            removeNullish(
                elementRow.map(
                    (e: LabelElementInfo) => (e as PropElementInfo).prop,
                ),
            ),
        );
        return concat(...props);
    }

    private init() {
        const stations = this.data.stations.filter(
            (station) => !station.invisible && !station.contained,
        );

        this.stationIdToInfoMap = new Map();
        stations.forEach((station) => {
            const stationInfo = this.createStationInfo(station);
            this.stationIdToInfoMap.set(stationInfo.id, stationInfo);
            stationInfo.products.forEach((product) =>
                product.lots.forEach((lot) => {
                    lot.deliveries.forEach((delivery) => {
                        this.deliveryToSourceMap.set(delivery, lot);
                    });
                    this.idToLotMap.set(lot.id, lot);
                }),
            );
        });

        addSampleInformation(
            Array.from(this.stationIdToInfoMap.values()),
            this.data.samples,
            this.viProps.sampleProps,
        );
    }

    private createStationInfo(station: StationData): StationInformation {
        const stationInfo: StationInformation = {
            id: station.id,
            data: station,
            props: this.getProps(station, this.viProps.stationProps),
            activities: this.getProperty(
                station.properties,
                InformationProvider.STATION_PROPERTY_ACTIVITY,
            ),
            samples: [],
            inSamples: [],
            products: this.createProductInformation(
                this.getStationOutDeliveries(station),
            ),
        };
        return stationInfo;
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
    private getProps(
        dataObj: {},
        properties: string[],
    ): { [key: string]: string | number | boolean } {
        const propsObj = {};
        for (const prop of properties) {
            propsObj[prop] = this.getPropValue(dataObj, prop);
        }
        return propsObj;
    }

    private getPropValue(
        dataObj: { properties?: { name: string; value: string }[] },
        prop: string,
    ): string | number | boolean {
        let value = dataObj[prop];

        if (value === undefined && dataObj.properties) {
            const propertyIndex = dataObj.properties.findIndex(
                (property) => property.name === prop,
            );
            if (propertyIndex >= 0) {
                value = dataObj.properties[propertyIndex].value;
            }
        }

        return value;
    }

    private getProperty(
        propList: PropertyEntry[],
        propName: string,
    ): string | null {
        const index: number = propList.findIndex(
            (p) => p.name.localeCompare(propName) === 0,
        );
        if (index >= 0) {
            const value = propList[index].value;
            return value + "";
        } else {
            return null;
        }
    }

    private createProductInformation(
        deliveries: DeliveryData[],
    ): ProductInformation[] {
        const productKeyFun = (d: DeliveryData) =>
            d.name ? `P:${d.name}` : `P:${d.id}`;
        const productToDeliveriesMap = Utils.getGroups(
            deliveries,
            productKeyFun,
        );
        return Array.from(productToDeliveriesMap).map(
            ([, productDeliveries]) => ({
                id: this.prodCounter++,
                lots: this.createLotInformation(productDeliveries),
            }),
        );
    }

    private createLotInformation(deliveries: DeliveryData[]): LotInformation[] {
        const lotKeyFun = (d: DeliveryData) =>
            d.name && d.lot ? `L:${d.name}||${d.lot}` : `D:${d.id}`;
        const lotToDeliveriesMap = Utils.getGroups(deliveries, lotKeyFun);
        return Array.from(lotToDeliveriesMap).map(([, lotDeliveries]) => {
            const id = "L" + this.lotCounter++;
            return {
                id: id,
                props: this.getProps(lotDeliveries[0], this.viProps.lotProps),
                key: lotDeliveries[0].lotKey ?? id,
                samples: [],
                deliveries: lotDeliveries.map((d) =>
                    this.createDeliveryInformation(d),
                ),
            };
        });
    }

    private getStationOutDeliveries(station: StationData): DeliveryData[] {
        return station.outgoing
            .map((delId) => this.idToDeliveryMap.get(delId)!)
            .filter(
                (d) =>
                    !d.invisible &&
                    !this.idToStationMap.get(d.source)!.invisible &&
                    !this.idToStationMap.get(d.target)!.invisible,
            );
    }

    getStationInfo(station: StationData): StationInformation {
        return this.stationIdToInfoMap.get(station.id)!;
    }

    getLotInfo(id: string): LotInformation {
        return this.idToLotMap.get(id)!;
    }

    createDeliveryInformation(delivery: DeliveryData): DeliveryInformation {
        return {
            forward: delivery.forward,
            backward: delivery.backward,
            date: delivery.dateOut,
            target: delivery.target, // consider to take another id system
        };
    }

    getDeliveries(): DeliveryInformation[] {
        return Array.from(this.deliveryToSourceMap.keys()).slice();
    }

    getDeliverySource(deliveryInfo: DeliveryInformation): LotInformation {
        return this.deliveryToSourceMap.get(deliveryInfo)!;
    }

    getDeliveryTarget(deliveryInfo: DeliveryInformation): StationInformation {
        return this.stationIdToInfoMap.get(deliveryInfo.target)!;
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    compressInformation() {}
}
