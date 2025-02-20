import { Injectable } from "@angular/core";
import {
    DataServiceInputState,
    DeliveryData,
    SampleData,
    TableColumn,
} from "../data.model";
import { DataService } from "../services/data.service";
import { TableService } from "../services/table.service";
import { getUpdatedObject, unionOfSets, Utils } from "../util/non-ui-utils";
import * as _ from "lodash";
import { LabelElementInfo, PropInfo } from "./model";
import { createDefaultROASettings, isPropElementInfoWithProp } from "./shared";

function propCompare(propA: PropInfo, propB: PropInfo): number {
    const textA = propA.label ?? propA.prop;
    const textB = propB.label ?? propB.prop;
    return textA.toUpperCase().localeCompare(textB.toUpperCase());
}

function sortProps(props: PropInfo[]): PropInfo[] {
    return props.sort(propCompare);
}

interface AvailableProps {
    companyProps: PropInfo[];
    lotProps: PropInfo[];
    sampleProps: PropInfo[];
}

const KNOWN_DELIVERY_SPECIFIC_PROPS = [
    "id",
    "dateOut",
    "dateIn",
    "crossContamination",
    "amount",
    "amountNumber",
    "amountUnit",
    "weight",
    "forward",
    "backward",
    "score",
    "killContamination",
    "outbreak",
    "observed",
    "target",
];
const LOT_PROPS_PREFERENCE = [
    "name",
    "lot",
    "lotAmount",
    "lotAmountNumber",
    "lotAmountUnit",
];

function isSimpleType(
    value: any | boolean | number | string,
): value is boolean | number | string {
    return ["boolean", "number", "string"].includes(value);
}

function getReferencedProps(labelElementInfos: LabelElementInfo[][]): string[] {
    return Array.from(
        new Set(
            labelElementInfos
                .flat()
                .filter(isPropElementInfoWithProp)
                .map((e) => e.prop),
        ),
    );
}

function column2PropInfo(c: TableColumn): PropInfo {
    return {
        prop: c.id,
        label: c.name,
        isDataUnavailable: c.dataIsUnavailable,
        warnings: c.dataIsUnavailable ? "Data is not available." : undefined,
    };
}

@Injectable({
    providedIn: "root",
})
export class ReportConfigurationService {
    private roaSettings = createDefaultROASettings();

    constructor(
        private tableService: TableService,
        private dataService: DataService,
    ) {}

    getAvailableProps(
        dataServiceInputState: DataServiceInputState,
    ): AvailableProps {
        const data = this.dataService.getData(dataServiceInputState);
        const stationColumnSets = this.tableService.getStationColumnSets(
            dataServiceInputState,
            data,
            true,
        );
        const deliveryColumnSets = this.tableService.getDeliveryColumnSets(
            dataServiceInputState,
            data,
            true,
        );

        const companyProps = this.getStationProperties(
            stationColumnSets.columns,
        );
        const lotProps = this.getLotProperties(
            deliveryColumnSets.columns,
            data.deliveries,
        );
        const sampleProps = this.getSampleProperties(
            dataServiceInputState.fclElements.samples,
        );

        return { companyProps, lotProps, sampleProps };
    }

    private getLotProperties(
        deliveryColumns: TableColumn[],
        deliveries: DeliveryData[],
    ): PropInfo[] {
        // there is no lot entity in the data model
        // so the lot specific properties need to be collected
        // a delivery property is considered a lot property iif all deliveries within a lot
        // have the same value for this property
        const deliveryGroups = Utils.groupDeliveriesByLot(deliveries);

        const availableProps = new Set(
            deliveryColumns
                .filter((c) => !c.dataIsUnavailable)
                .map((p) => p.id),
        );
        let consistentProps = Array.from(availableProps);
        for (const deliveryGroup of deliveryGroups) {
            consistentProps = consistentProps.filter((propId) => {
                const propValues = new Set(
                    deliveryGroup.map((delivery) =>
                        this.getPropertyValue(delivery, propId),
                    ),
                );
                if (propValues.size > 1) {
                    const tmp = 3;
                }
                return propValues.size === 1;
            });
        }

        const referencedProps = getReferencedProps(
            this.roaSettings.labelSettings.lotLabel,
        );
        const requiredProps = unionOfSets(
            availableProps,
            new Set(referencedProps),
        );
        const lotProperties = deliveryColumns
            .filter((x) => requiredProps.has(x.id))
            .map(column2PropInfo)
            .map((p) =>
                getUpdatedObject(p, {
                    warnings:
                        p.warnings ??
                        (consistentProps.indexOf(p.prop) < 0
                            ? "Data is not lot consistent."
                            : KNOWN_DELIVERY_SPECIFIC_PROPS.indexOf(p.prop) >= 0
                              ? "Data is known to be delivery specific."
                              : undefined),
                }),
            );

        lotProperties.sort((p1, p2) => {
            const p1Index = LOT_PROPS_PREFERENCE.indexOf(p1.prop);
            const p2Index = LOT_PROPS_PREFERENCE.indexOf(p2.prop);
            if (p1Index >= 0) {
                return p2Index >= 0 ? p1Index - p2Index : -1;
            } else if (p2Index >= 0) {
                return 1;
            }
            const p1IsDelSpecific = KNOWN_DELIVERY_SPECIFIC_PROPS.includes(
                p1.prop,
            );
            const p2IsDelSpecific = KNOWN_DELIVERY_SPECIFIC_PROPS.includes(
                p2.prop,
            );
            if (p1IsDelSpecific === p2IsDelSpecific) {
                return p1.label.localeCompare(p2.label);
            } else {
                return p2IsDelSpecific ? -1 : 1;
            }
        });
        return lotProperties;
    }

    private getStationProperties(stationColumns: TableColumn[]): PropInfo[] {
        const availableProps = new Set(
            stationColumns.filter((c) => !c.dataIsUnavailable).map((c) => c.id),
        );

        const referencedProps = getReferencedProps(
            this.roaSettings.labelSettings.stationLabel,
        );
        const requiredProps = unionOfSets(
            availableProps,
            new Set(referencedProps),
        );
        const stationProperties: PropInfo[] = stationColumns
            .filter((x) => requiredProps.has(x.id))
            .map(column2PropInfo);

        return stationProperties;
    }

    private getSampleProperties(samples: SampleData[]): PropInfo[] {
        const props = new Set<string>();
        for (const sample of samples) {
            Object.entries(sample)
                .filter(([key, value]) => isSimpleType(value))
                .forEach(([key]) => props.add(key));
        }
        const properties = Array.from(props).map((prop) => ({
            prop: prop,
            label: prop,
        }));
        return sortProps(properties);
    }

    private getPropertyValue(element: DeliveryData, propId: string): any {
        return (
            element[propId] ??
            element.properties.find((p) => p.name === propId)?.value
        );
    }
}
