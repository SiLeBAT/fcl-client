interface SharedElementInfo {
    dependendOnProp?: string;
}
export interface TextElementInfo extends SharedElementInfo {
    text: string;
}

export interface PropElementInfo extends SharedElementInfo {
    prop: string | null;
    altText: string;
    isNullable: boolean;
    interpretAsNumber?: boolean;
}

export type LabelElementInfo = TextElementInfo | PropElementInfo;

export interface ROALabelSettings {
    stationLabel: LabelElementInfo[][];
    lotLabel: LabelElementInfo[][];
    lotSampleLabel: LabelElementInfo[][];
    stationSampleLabel: LabelElementInfo[][];
}

export interface ROASettings {
    labelSettings: ROALabelSettings;
    roundNumbers: boolean;
}

export interface AmountUnitPair {
    amount: PropElementInfo;
    unit: PropElementInfo;
}
