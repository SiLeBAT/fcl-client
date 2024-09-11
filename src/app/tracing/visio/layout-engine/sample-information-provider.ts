import {SampleData} from '../../data.model';
import {
  StationInformation,
  LotInformation,
  SampleInformation,
  InSampleInformation,
  StationSampleInformation,
} from './datatypes';
import {Utils} from '../../util/non-ui-utils';
import {PartialPick, RequiredPick} from '@app/tracing/util/utility-types';

interface MappedSample {
  sampleStation: StationInformation;
  sourceStation?: StationInformation;
  lotInfo?: LotInformation;
  plausible: boolean;
  sample: SampleData;
}

export function addSampleInformation(
  stationsInfo: StationInformation[],
  samples: SampleData[],
  sampleProps: string[]
) {
  const mapped_samples = mapSamples(samples, stationsInfo);

  addSamples(mapped_samples, stationsInfo, sampleProps);
}

function addSamples(
  mapped_samples: MappedSample[],
  stationsInfo: StationInformation[],
  sampleProps: string[]
) {
  mapped_samples
    .filter(s => s.plausible)
    .forEach(mappedSample => {
      if (!mappedSample.lotInfo) {
        mappedSample.sampleStation.samples.push(
          createStationSample(mappedSample.sample, sampleProps)
        );
      } else if (mappedSample.sampleStation === mappedSample.sourceStation) {
        mappedSample.lotInfo.samples.push(
          createLotSample(mappedSample.sample, sampleProps)
        );
      } else {
        mappedSample.sampleStation.inSamples.push(
          createInSample(mappedSample, sampleProps)
        );
      }
    });

  mergeInSamples(stationsInfo);
}

function createStationSample(
  sample: SampleData,
  sampleProps: string[]
): StationSampleInformation {
  return {
    props: sampleProps.reduce((pV, cV) => {
      pV[cV] = sample[cV];
      return pV;
    }, {}),
    resultType: sample.resultType,
  };
}

function createLotSample(
  sample: SampleData,
  sampleProps: string[]
): SampleInformation {
  return {
    props: sampleProps.reduce((pV, cV) => {
      pV[cV] = sample[cV];
      return pV;
    }, {}),
    resultType: sample.resultType,
  };
}

function createInSample(
  mappedSample: MappedSample,
  sampleProps: string[]
): InSampleInformation {
  return {
    lotId: mappedSample.lotInfo!.id,
    samples: [createLotSample(mappedSample.sample, sampleProps)],
  };
}

function mergeInSamples(stationsInfo: StationInformation[]) {
  for (const station of stationsInfo) {
    const newInSamples: InSampleInformation[] = [];
    for (const inSample of station.inSamples) {
      if (
        newInSamples.length === 0 ||
        newInSamples[newInSamples.length - 1].lotId !== inSample.lotId
      ) {
        newInSamples.push(inSample);
      } else {
        newInSamples[newInSamples.length - 1].samples.push(inSample.samples[0]);
      }
    }
  }
}

function mapSamples(
  samples: SampleData[],
  stationsInfo: StationInformation[]
): MappedSample[] {
  const mapped_samples: PartialPick<MappedSample, 'sampleStation'>[] =
    samples.map(s => ({
      plausible: false,
      sample: s,
    }));

  const mappedSamplesWithStation = assignSampleStation(
    mapped_samples,
    stationsInfo
  );
  assignSourceStationAndLot(mappedSamplesWithStation, stationsInfo);
  checkPlausibility(mappedSamplesWithStation);

  return mappedSamplesWithStation;
}

function assignSampleStation(
  mappedSamples: PartialPick<MappedSample, 'sampleStation'>[],
  stationsInfo: StationInformation[]
): MappedSample[] {
  const filtered_samples = mappedSamples.filter(
    ms => ms.sample.station != null
  );
  const stationKeyToStationMap: Map<string, StationInformation> =
    Utils.arrayToMap(stationsInfo, s => s.id);

  filtered_samples.forEach(ms => {
    ms.sampleStation = stationKeyToStationMap.get(ms.sample.station);
  });
  return filtered_samples.filter(s => s.sampleStation) as MappedSample[];
}

function assignSourceStationAndLot(
  mappedSamples: MappedSample[],
  stationsInfo: StationInformation[]
) {
  const filtered_samples = mappedSamples.filter(
    ms => ms.sample.lot != null && ms.sampleStation !== null
  );
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
    s.sourceStation = lotKeyToStationMap.get(s.sample.lot!);
    s.lotInfo = lotKeyToLotMap.get(s.sample.lot!);
  });
}

function checkPlausibility(mappedSamples: MappedSample[]) {
  for (const mappedSample of mappedSamples) {
    if (mappedSample.sampleStation != null) {
      if (mappedSample.sample.lot != null) {
        // lot sample
        if (mappedSample.lotInfo) {
          if (mappedSample.sampleStation === mappedSample.sourceStation) {
            // out sample
            mappedSample.plausible = true;
          } else {
            // inSample
            mappedSample.plausible = isInSamplePlausible(
              mappedSample as RequiredPick<MappedSample, 'lotInfo'>
            );
          }
        }
      } else {
        // station sample
        mappedSample.plausible = true;
      }
    }
  }
}

function isInSamplePlausible(
  mappedSample: RequiredPick<MappedSample, 'lotInfo'>
) {
  return (
    mappedSample.lotInfo.deliveries
      .map(d => d.target)
      .indexOf(mappedSample.sampleStation.id) >= 0
  );
}
