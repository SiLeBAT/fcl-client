import { VisioReport, VisioBox, StationInformation, LotInformation, FontMetrics,
    VisioContainer, SampleInformation, BoxType, VisioLabel, Size, ReportType } from './datatypes';
import { FclElements, Position } from './../../util/datatypes';
import { Utils } from './../../util/utils';
import { GraphSettings } from './graph-settings';
// import { FontMetrics } from './font-metrics';
import { BoxCreator } from './box-creator';


export abstract class LabelCreator {
    // protected fontMetrics: FontMetrics;

    protected constructor(protected fontMetrics: FontMetrics) {
        // this.fontMetrics = new FontMetrics(canvas);
    }

    getLotSampleLabel(sampleInfo: SampleInformation): VisioLabel {
        const text: string[]  = [
            sampleInfo.amount,
            sampleInfo.result,
            sampleInfo.time
        ];
        return this.getLabel(text, GraphSettings.SAMPLE_BOX_MARGIN);
    }

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
