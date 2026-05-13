import {
    LabelElementInfo,
    PropElementInfo,
    PropInfo,
    ROASettings,
    TextElementInfo,
} from "./model";

const LCASE_NUMBER_UNIT_SUFFIX_PAIRS = [
    { numberSuffix: "number", unitSuffix: "unit" },
    { numberSuffix: "amount", unitSuffix: "unit" },
];

export function getUnitPropFromAmountProp(
    amountProp: string | null,
    availableProps: PropInfo[],
): string | null {
    if (amountProp !== null) {
        const lCaseAmountProp = amountProp.toLowerCase();
        for (const numberUnitSuffixPair of LCASE_NUMBER_UNIT_SUFFIX_PAIRS) {
            if (lCaseAmountProp.endsWith(numberUnitSuffixPair.numberSuffix)) {
                const lCasePropPrefix = lCaseAmountProp.slice(
                    0,
                    amountProp.length -
                        numberUnitSuffixPair.numberSuffix.length,
                );
                const lCaseUnitProp =
                    lCasePropPrefix + numberUnitSuffixPair.unitSuffix;
                for (const propInfo of availableProps) {
                    if (propInfo.prop.toLowerCase() === lCaseUnitProp) {
                        return propInfo.prop;
                    }
                }
            }
        }
    }
    return null;
}

export function createDefaultROASettings(): ROASettings {
    return {
        labelSettings: {
            stationLabel: [
                [
                    {
                        prop: "typeOfBusiness",
                        altText: "Unknown activity",
                        isNullable: false,
                    },
                    { text: ": " },
                    { prop: "name", altText: "Unknown FBO", isNullable: false },
                ],
            ],

            lotLabel: [
                [
                    {
                        prop: "name",
                        altText: "Unknown product name",
                        isNullable: false,
                    },
                ],
                [
                    { text: "Lot: " },
                    { prop: "lot", altText: "unknown", isNullable: false },
                ],
                [
                    { text: "Amount: " },
                    {
                        prop: "lotAmount",
                        altText: "unknown",
                        isNullable: false,
                    },
                    { text: " " },
                    { prop: null, altText: "unknown", isNullable: true },
                ],
            ],

            stationSampleLabel: [
                [{ prop: "type", altText: "Unknown type", isNullable: false }],
                [
                    {
                        prop: "material",
                        altText: "Unknown material",
                        isNullable: false,
                    },
                ],
                [
                    {
                        prop: "amount",
                        altText: "Unknown amount",
                        isNullable: false,
                    },
                ],
                [
                    {
                        prop: "result",
                        altText: "Unknown result",
                        isNullable: false,
                    },
                ],
                [{ prop: "time", altText: "Unknown time", isNullable: false }],
            ],

            lotSampleLabel: [
                [{ prop: "type", altText: "Unknown type", isNullable: false }],
                [
                    {
                        prop: "amount",
                        altText: "Unknown amount",
                        isNullable: false,
                    },
                ],
                [
                    {
                        prop: "result",
                        altText: "Unknown result",
                        isNullable: false,
                    },
                ],
                [{ prop: "time", altText: "Unknown time", isNullable: false }],
            ],
        },
        roundNumbers: true,
    };
}

export function isTextElementInfo(
    element: LabelElementInfo,
): element is TextElementInfo {
    return (element as PropElementInfo).prop === undefined;
}

export function isPropElementInfo(
    element: LabelElementInfo,
): element is PropElementInfo {
    return (element as PropElementInfo).prop !== undefined;
}

export function isPropElementInfoWithProp(
    element: LabelElementInfo | (PropElementInfo & { prop: string }),
): element is PropElementInfo & { prop: string } {
    return isPropElementInfo(element) && element.prop != null;
}

export function generateDefaultReportNamePrefixFromSourceFileName(
    sourceFileName?: string,
): string | undefined {
    if (sourceFileName === undefined) {
        return undefined;
    }
    return sourceFileName.replace(/\.[^\.]+$/, "");
}
