import { waitForAsync } from '@angular/core/testing';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { createInitialFclDataState } from '../../state/tracing.reducers';
import { DataImporterV1 } from './data-importer-v1';

const FILEPATH_OF_MODEL_WITH_MISSING_TRACING_ENTRIES = '../../../../assets/test_data/ModelWithMissingTracingEntries.json';

function getAggregatedIds(...idArrays: string[][]): string[] {
    return _.uniq([].concat(...idArrays)).sort();
}

class HttpClientMock {
    get(filePath: string): Observable<Object> {
        const data = require(filePath);
        return of(data);
    }
}

describe('DataImporterV1', () => {

    let dataImporterV1: DataImporterV1;

    beforeEach(waitForAsync(() => {
        const httpClientMock = new HttpClientMock();
        dataImporterV1 = new DataImporterV1(httpClientMock as any);
    }));

    it('should instantiate the dataImporterV1', () => {
        expect(dataImporterV1).toBeTruthy();
    });

    it('should add missing tracing entries for station/group/delivery element', async () => {
        const extData = require(FILEPATH_OF_MODEL_WITH_MISSING_TRACING_ENTRIES);
        const fclData = createInitialFclDataState();
        fclData.source = {};
        return dataImporterV1.preprocessData(extData, fclData)
            .then(() => {
                const observed = {
                    statTracIds: getAggregatedIds(fclData.tracingSettings.stations.map(s => s.id)),
                    delTracIds: getAggregatedIds(fclData.tracingSettings.deliveries.map(d => d.id))
                };
                const expected = {
                    statTracIds: getAggregatedIds(
                        fclData.fclElements.stations.map(s => s.id),
                        fclData.groupSettings.map(g => g.id)
                    ),
                    delTracIds: getAggregatedIds(fclData.fclElements.deliveries.map(d => d.id))
                };

                expect(observed).toEqual(expected);
            })
            .catch(error => {
                throw error;
            });
    });
});
