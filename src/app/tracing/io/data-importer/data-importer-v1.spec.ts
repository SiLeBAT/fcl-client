import { waitForAsync } from '@angular/core/testing';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { FclData } from '../../data.model';
import { createInitialFclDataState } from '../../state/tracing.reducers';
import { Constants } from '../../util/constants';
import { JsonData, VERSION } from '../ext-data-model.v1';
import { DataImporterV1 } from './data-importer-v1';

function getAggregatedIds(...idArrays: string[][]): string[] {
    return _.uniq([].concat(...idArrays)).sort();
}

function checkElementTracSettingsCompleteness(fclData: FclData): void {
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
        const extData: JsonData = require(Constants.EXAMPLE_MODEL_FILE_PATH);
        // simulate no tracing settings in the external model
        extData.tracing = null;
        let fclData = createInitialFclDataState();
        fclData.source = {};
        return dataImporterV1.preprocessData(extData, fclData)
            .then(() => {
                checkElementTracSettingsCompleteness(fclData);

                const allStatIds = [].concat(
                    fclData.fclElements.stations.map(s => s.id),
                    fclData.groupSettings.map(g => g.id)
                );
                // simulate only some missing element tracing setting entries in the external model
                extData.tracing = {
                    version: VERSION,
                    nodes: allStatIds.map(statId => ({
                        id: statId,
                        weight: 0,
                        killContamination: false,
                        crossContamination: false,
                        observed: false
                    })).slice(0, allStatIds.length - 1),
                    deliveries: fclData.fclElements.deliveries.map(d => ({
                        id: d.id,
                        weight: 0,
                        killContamination: false,
                        crossContamination: false,
                        observed: false
                    })).slice(0, fclData.fclElements.deliveries.length - 1)
                }

                fclData = createInitialFclDataState();
                fclData.source = {};
                return dataImporterV1.preprocessData(extData, fclData);
            })
            .then(() => {
                checkElementTracSettingsCompleteness(fclData);
            })
            .catch(error => {
                throw error;
            });
    });
});
