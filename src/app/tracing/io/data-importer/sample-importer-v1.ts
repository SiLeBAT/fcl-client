import { SampleData, FclData, SampleResultType } from '../../data.model';
import * as Constants from './../ext-data-constants.v1';

export function importSamples(rawData: any, fclData: FclData) {
    fclData.fclElements.samples = convertRawSamples(rawData);
}

function convertRawSamples(rawData: any): SampleData[] {
    if (rawData != null && rawData[Constants.SAMPLEDATA] !== undefined) {
        const result: SampleData[] = [];
        for (const rawSample of rawData[Constants.SAMPLEDATA]) {
            result.push({
                station: rawSample.sampleStation || null,
                lot: rawSample.sampledLot || null,
                result: rawSample.result || null,
                resultType: convertRawSampleResultType(rawSample.resultType),
                time: rawSample.time || null,
                amount: rawSample.amount || null,
                type: rawSample.type || null,
                material: rawSample.material || null
            });
        }
        return result;
    }
    return [];
}

function convertRawSampleResultType(type: string): SampleResultType {
    if (type == null) {
        return SampleResultType.Unkown;
    } else if (type === 'C') {
        return SampleResultType.Confirmed;
    } else if (type === 'N') {
        return SampleResultType.Negative;
    } else if (type === 'P') {
        return SampleResultType.Probable;
    } else {
        return SampleResultType.Unkown;
    }
}
