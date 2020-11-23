import { StationInformation, LotInformation, FontMetrics,
    StationSampleInformation, VisioLabel } from './datatypes';

export abstract class LabelCreator {

    protected constructor(protected fontMetrics: FontMetrics) {
    }

    static getText(text: string, alternativeText: string): string {
        if (text === undefined || text === null) {
            return alternativeText;
        } else {
            return text;
        }
    }

    abstract getStationSampleLabel(sampleInfo: StationSampleInformation): VisioLabel;
    abstract getLotSampleLabel(sampleInfo: StationSampleInformation): VisioLabel;
    abstract getLotLabel(lotInfo: LotInformation): VisioLabel;
    abstract getStationLabel(stationInfo: StationInformation): VisioLabel;

    getLabel(text: string[], margin: number): VisioLabel {
        return {
            text: text,
            size: this.fontMetrics.measureText(text),
            relPosition: { x: margin, y: margin }
        };
    }
}
