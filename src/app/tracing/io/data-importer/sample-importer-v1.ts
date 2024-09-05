import { SampleData as IntSampleData, FclData, SampleResultType } from '../../data.model';
import { JsonData } from '../ext-data-model.v1';

export function importSamples(rawData: any, fclData: FclData) {
    fclData.fclElements.samples = convertRawSamples(rawData);
}

function convertRawSamples(jsonData: JsonData): IntSampleData[] {
    if (jsonData.samples) {
        const intSamples: IntSampleData[] = [];
        for (const extSample of jsonData.samples) {

            const intSample: IntSampleData = {
                station: extSample.sampleStation,
                lot: extSample.sampledLot ?? undefined,
                result: extSample.result ?? undefined,
                resultType: convertRawSampleResultType(extSample.resultType),
                time: extSample.time ?? undefined,
                amount: extSample.amount ?? undefined,
                type: extSample.type ?? undefined,
                material: extSample.material ?? undefined
            };
            intSamples.push(intSample);
        }
        return intSamples;
    }
    return [];
}

function convertRawSampleResultType(type: string | undefined | null): SampleResultType {
    if (type == null) {
        return SampleResultType.Unknown;
    } else if (type === 'C') {
        return SampleResultType.Confirmed;
    } else if (type === 'N') {
        return SampleResultType.Negative;
    } else if (type === 'P') {
        return SampleResultType.Probable;
    } else {
        return SampleResultType.Unknown;
    }
}
