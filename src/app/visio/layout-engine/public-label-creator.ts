import { StationInformation, LotInformation, VisioLabel } from './datatypes';
import { LabelCreator } from './label-creator';
import { GraphSettings } from './graph-settings';

export class PublicLabelCreator extends LabelCreator {
    constructor(canvas: any) {
        super(canvas);
    }

    getLotLabel(lotInfo: LotInformation): VisioLabel {
        const text: string[] = [
            LabelCreator.getText(lotInfo.commonProductName, 'unkown product name'),
            'Amount: ' + LabelCreator.getText(lotInfo.quantity, 'unkown')
        ];
        return this.getLabel(text, GraphSettings.LOT_BOX_MARGIN);
    }

    getStationLabel(stationInfo: StationInformation): VisioLabel {
        const text: string[] = [
            LabelCreator.getText(stationInfo.activities, 'unkown activity') + ' ' + stationInfo.ctno
        ];
        return this.getLabel(text, GraphSettings.STATION_BOX_MARGIN);
    }
}
