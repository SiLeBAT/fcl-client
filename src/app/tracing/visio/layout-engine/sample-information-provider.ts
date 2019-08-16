import * as _ from 'lodash';
import { SampleData } from '../../data.model';
import { StationInformation, LotInformation,
    SampleInformation, InSampleInformation, StationSampleInformation } from './datatypes';
import { Utils } from '../../util/non-ui-utils';

interface MappedSample {
    sampleStation: StationInformation;
    sourceStation: StationInformation;
    lotInfo: LotInformation;
    plausible: boolean;
    sample: SampleData;
}

export function addSampleInformation(
    stationsInfo: StationInformation[],
    samples: SampleData[]) {

    const mapped_samples = mapSamples(samples, stationsInfo);

    addSamples(mapped_samples, stationsInfo);
}

function addSamples(mapped_samples: MappedSample[], stationsInfo) {
    mapped_samples.filter(s => s.plausible).forEach(mappedSample => {
        if (mappedSample.lotInfo === null) {
            mappedSample.sampleStation.samples.push(createStationSample(mappedSample.sample));
        } else if (mappedSample.sampleStation === mappedSample.sourceStation) {
            mappedSample.lotInfo.samples.push(createLotSample(mappedSample.sample));
        } else {
            mappedSample.sampleStation.inSamples.push(createInSample(mappedSample));
        }
    });

    mergeInSamples(stationsInfo);
}

function createStationSample(sample: SampleData): StationSampleInformation {
    return {
        type: sample.type,
        material: sample.material,
        time: sample.time,
        amount: sample.amount,
        result: sample.result,
        resultType: sample.resultType
    };
}

function createLotSample(sample: SampleData): SampleInformation {
    return {
        type: sample.type,
        time: sample.time,
        amount: sample.amount,
        result: sample.result,
        resultType: sample.resultType
    };
}

function createInSample(mappedSample: MappedSample): InSampleInformation {
    return {
        lotId: mappedSample.lotInfo.id,
        samples: [createLotSample(mappedSample.sample)]
    };
}

function mergeInSamples(stationsInfo: StationInformation[]) {
    for (const station of stationsInfo) {
        const newInSamples: InSampleInformation[] = [];
        for (const inSample of station.inSamples) {
            if (newInSamples.length === 0 || newInSamples[newInSamples.length - 1].lotId !== inSample.lotId) {
                newInSamples.push(inSample);
            } else {
                newInSamples[newInSamples.length - 1].samples.push(inSample.samples[0]);
            }
        }
    }
}

function mapSamples(samples: SampleData[], stationsInfo: StationInformation[]): MappedSample[] {

    const mapped_samples: MappedSample[] = samples.map(s => ({
        sampleStation: null,
        sourceStation: null,
        lotInfo: null,
        plausible: false,
        sample: s
    }));

    assignSampleStation(mapped_samples.filter(s => s.sample.station != null), stationsInfo);
    assignSourceStationAndLot(mapped_samples.filter(s => s.sampleStation != null), stationsInfo);

    checkPlausibility(mapped_samples);
    return mapped_samples;
}

function assignSampleStation(mappedSamples: MappedSample[], stationsInfo: StationInformation[]) {
    const filtered_samples = mappedSamples.filter(ms => ms.sample.station != null);
    const stationKeyToStationMap: Map<string, StationInformation> = Utils.arrayToMap(stationsInfo, (s) => s.id);

    filtered_samples.forEach(ms => {
        ms.sampleStation = stationKeyToStationMap.get(ms.sample.station);
    });
}

function assignSourceStationAndLot(mappedSamples: MappedSample[], stationsInfo: StationInformation[]) {
    const filtered_samples = mappedSamples.filter(ms => ms.sample.lot != null && ms.sampleStation !== null);
    const lotKeyToLotMap: Map<string, LotInformation> = new Map();
    const lotKeyToStationMap: Map<string, StationInformation> = new Map();

    stationsInfo.forEach(stationInfo =>
        stationInfo.products.forEach(product =>
            product.lots.forEach(lot => {
                lotKeyToLotMap.set(lot.key, lot);
                lotKeyToStationMap.set(lot.key, stationInfo);
            })
        )
    );
    filtered_samples.forEach(s => {
        s.sourceStation = lotKeyToStationMap.get(s.sample.lot);
        s.lotInfo = lotKeyToLotMap.get(s.sample.lot);
    });
}

function checkPlausibility(mappedSamples: MappedSample[]) {
    for (const mappedSample of mappedSamples) {
        if (mappedSample.sampleStation != null) {
            if (mappedSample.sample.lot != null) {
                // lot sample
                if (mappedSample.lotInfo != null) {
                    if (mappedSample.sampleStation === mappedSample.sourceStation) {
                        // out sample
                        mappedSample.plausible = true;
                    } else {
                        // inSample
                        mappedSample.plausible = isInSamplePlausible(mappedSample);
                    }
                }
            } else {
                // station sample
                mappedSample.plausible = true;
            }
        }
    }
}

function isInSamplePlausible(mappedSample: MappedSample) {
    return mappedSample.lotInfo.deliveries.map(d => d.target).indexOf(mappedSample.sampleStation.id) >= 0;
}
