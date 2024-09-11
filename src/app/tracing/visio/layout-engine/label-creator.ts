import {
  StationInformation,
  LotInformation,
  FontMetrics,
  StationSampleInformation,
  VisioLabel,
  StyleOptions,
} from './datatypes';

export interface LabelingOptions {
  firstLineIsBold?: boolean;
}

const HEADER_LINE_REL_BOTTOM_SPACE = 0.25;

export abstract class LabelCreator {
  protected constructor(protected fontMetrics: FontMetrics) {}

  static getText(text: string, alternativeText: string): string {
    if (text === undefined || text === null) {
      return alternativeText;
    } else {
      return text;
    }
  }

  abstract getStationSampleLabel(
    sampleInfo: StationSampleInformation
  ): VisioLabel[];
  abstract getLotSampleLabel(
    sampleInfo: StationSampleInformation
  ): VisioLabel[];
  abstract getLotLabel(lotInfo: LotInformation): VisioLabel[];
  abstract getStationLabel(stationInfo: StationInformation): VisioLabel[];

  getLabel(
    text: string[],
    margin: number,
    styleOptions?: StyleOptions
  ): VisioLabel {
    return {
      style: styleOptions,
      text: text,
      size: this.fontMetrics.measureText(text, styleOptions),
      relPosition: {x: margin, y: margin},
    };
  }

  getLabels(
    text: string[],
    margin: number,
    options?: LabelingOptions
  ): VisioLabel[] {
    options = options ?? {};
    if (options.firstLineIsBold) {
      const labels: VisioLabel[] = [];
      if (text.length > 0) {
        labels.push(this.getLabel(text.slice(0, 1), margin, {bold: true}));
      }
      if (text.length > 1) {
        labels.push(this.getLabel(text.slice(1), margin));
        labels[1].relPosition.y =
          labels[0].relPosition.y +
          labels[0].size.height * (1 + HEADER_LINE_REL_BOTTOM_SPACE);
      }
      return labels;
    } else {
      return [this.getLabel(text, margin)];
    }
  }
}
