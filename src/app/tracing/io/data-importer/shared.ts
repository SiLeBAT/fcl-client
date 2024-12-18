import {
    HighlightingSettings,
    OperationType,
    ValueType,
    LinePatternType,
    StationHighlightingRule,
    HighlightingRule,
    DeliveryHighlightingRule,
} from "../../data.model";
import { LABELS } from "../../util/labels";

const STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX = "SDHR";
const DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX = "DDHR";

export function compareVersions(version1: string, version2: string): number {
    const versionNumbers1: number[] = version1.split(".").map((s) => Number(s));
    const versionNumbers2: number[] = version2.split(".").map((s) => Number(s));

    for (let i = 0; i < 3; i++) {
        if (versionNumbers1[i] !== versionNumbers2[i]) {
            return versionNumbers1[i] < versionNumbers2[i] ? -1 : 1;
        }
    }
    return 0;
}

export function areMajorVersionsMatching(
    version1: string,
    version2: string,
): boolean {
    const versionNumbers1: number[] = version1.split(".").map((s) => Number(s));
    const versionNumbers2: number[] = version2.split(".").map((s) => Number(s));

    return versionNumbers1[0] === versionNumbers2[0];
}

export function checkVersionFormat(version: string): boolean {
    const isVersionNumber = /^\d+\.\d+\.\d+$/.test(version.trim());
    return isVersionNumber;
}

function createDefaultHRule(): Omit<
    HighlightingRule,
    "id" | "name" | "showInLegend"
> {
    return {
        userDisabled: false,
        autoDisabled: false,
        color: null,
        invisible: false,
        adjustThickness: false,
        labelProperty: null,
        valueCondition: null,
        logicalConditions: [[]],
    };
}

function createDefaultStatHRule(): Omit<
    StationHighlightingRule,
    "id" | "name" | "showInLegend"
> {
    return {
        ...createDefaultHRule(),
        shape: null,
    };
}

function createDefaultDelHRule(): Omit<
    DeliveryHighlightingRule,
    "id" | "name" | "showInLegend"
> {
    return {
        ...createDefaultHRule(),
        linePattern: LinePatternType.SOLID,
    };
}

export function createDefaultStationAnonymizationLabelHRule(): StationHighlightingRule {
    return {
        ...createDefaultStatHRule(),
        id: "anoStatLabelRule",
        name: LABELS.anonymisationLabel,
        showInLegend: false,
        userDisabled: true,
        labelPrefix: "Station",
        labelParts: [
            {
                prefix: " ",
                property: "country",
            },
            {
                prefix: " ",
                property: "typeOfBusiness",
            },
            {
                prefix: " ",
                useIndex: true,
            },
        ],
        logicalConditions: [[]],
    };
}

export function createDefaultStationHRules(
    addDefaultAnoRule: boolean,
): StationHighlightingRule[] {
    const hRules: StationHighlightingRule[] = [
        {
            ...createDefaultStatHRule(),
            id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Outbreak",
            name: LABELS.outbreak,
            showInLegend: true,
            color: {
                r: 255,
                g: 0,
                b: 0,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "weight",
                        operationType: OperationType.GREATER,
                        value: "0",
                    },
                ],
            ],
        },
        {
            ...createDefaultStatHRule(),
            id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Observed",
            name: LABELS.observed,
            showInLegend: true,
            color: {
                r: 0,
                g: 255,
                b: 0,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "observed",
                        operationType: OperationType.NOT_EQUAL,
                        value: "none",
                    },
                ],
            ],
        },
        {
            ...createDefaultStatHRule(),
            id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Forward Trace",
            name: LABELS.forward,
            showInLegend: true,
            color: {
                r: 255,
                g: 200,
                b: 0,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "forward",
                        operationType: OperationType.EQUAL,
                        value: "1",
                    },
                ],
            ],
        },
        {
            ...createDefaultStatHRule(),
            id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Backward Trace",
            name: LABELS.backward,
            showInLegend: true,
            color: {
                r: 255,
                g: 0,
                b: 255,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "backward",
                        operationType: OperationType.EQUAL,
                        value: "1",
                    },
                ],
            ],
        },
        {
            ...createDefaultStatHRule(),
            id:
                STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX +
                "Cross Contamination",
            name: LABELS.crossContamination,
            showInLegend: true,
            color: {
                r: 0,
                g: 0,
                b: 0,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "crossContamination",
                        operationType: OperationType.EQUAL,
                        value: "1",
                    },
                ],
            ],
        },
        {
            ...createDefaultStatHRule(),
            id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Common Link",
            name: LABELS.commonLink,
            showInLegend: true,
            color: {
                r: 255,
                g: 255,
                b: 0,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "score",
                        operationType: OperationType.EQUAL,
                        value: "1",
                    },
                ],
            ],
        },
        {
            ...createDefaultStatHRule(),
            id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Score",
            name: LABELS.score,
            showInLegend: false,
            adjustThickness: true,
            valueCondition: {
                propertyName: "score",
                valueType: ValueType.VALUE,
                useZeroAsMinimum: true,
            },
            logicalConditions: null,
        },
        {
            ...createDefaultStatHRule(),
            id: STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "StationLabel",
            name: LABELS.stationLabel,
            showInLegend: false,
            labelProperty: "name",
            logicalConditions: [[]],
        },
        {
            ...createDefaultStatHRule(),
            id:
                STATION_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX +
                "Kill Contamination",
            name: LABELS.killContamination,
            showInLegend: true,
            color: { r: 153, g: 153, b: 153 },
            logicalConditions: [
                [
                    {
                        propertyName: "killContamination",
                        operationType: OperationType.EQUAL,
                        value: "1",
                    },
                ],
            ],
        },
    ];
    if (addDefaultAnoRule) {
        hRules.push(createDefaultStationAnonymizationLabelHRule());
    }
    return hRules;
}

export function createDefaultDeliveryHRules(): DeliveryHighlightingRule[] {
    const hRules = [
        {
            ...createDefaultDelHRule(),
            id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Outbreak",
            name: LABELS.outbreak,
            showInLegend: true,
            color: {
                r: 255,
                g: 0,
                b: 0,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "weight",
                        operationType: OperationType.GREATER,
                        value: "0",
                    },
                ],
            ],
        },
        {
            ...createDefaultDelHRule(),
            id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Observed",
            name: LABELS.observed,
            showInLegend: true,
            color: {
                r: 0,
                g: 255,
                b: 0,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "observed",
                        operationType: OperationType.NOT_EQUAL,
                        value: "none",
                    },
                ],
            ],
        },
        {
            ...createDefaultDelHRule(),
            id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Forward Trace",
            name: LABELS.forward,
            showInLegend: true,
            color: {
                r: 255,
                g: 200,
                b: 0,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "forward",
                        operationType: OperationType.EQUAL,
                        value: "1",
                    },
                ],
            ],
        },
        {
            ...createDefaultDelHRule(),
            id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "Backward Trace",
            name: LABELS.backward,
            showInLegend: true,
            color: {
                r: 255,
                g: 0,
                b: 255,
            },
            logicalConditions: [
                [
                    {
                        propertyName: "backward",
                        operationType: OperationType.EQUAL,
                        value: "1",
                    },
                ],
            ],
        },
        {
            ...createDefaultDelHRule(),
            id:
                DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX +
                "Kill Contamination",
            name: LABELS.killContamination,
            showInLegend: true,
            color: { r: 153, g: 153, b: 153 },
            logicalConditions: [
                [
                    {
                        propertyName: "killContamination",
                        operationType: OperationType.EQUAL,
                        value: "1",
                    },
                ],
            ],
        },
        {
            ...createDefaultDelHRule(),
            id: DELIVERY_DEFAULT_HIGHLIGHTING_RULE_ID_PREFIX + "DeliveryLabel",
            name: LABELS.deliveryLabel,
            showInLegend: false,
            labelProperty: "name",
            logicalConditions: [[]],
        },
    ];
    return hRules;
}

export function createDefaultHighlights(): HighlightingSettings {
    const defaultHighlights: HighlightingSettings = {
        invisibleStations: [],
        invisibleDeliveries: [],
        stations: createDefaultStationHRules(true),
        deliveries: createDefaultDeliveryHRules(),
    };

    return defaultHighlights;
}
