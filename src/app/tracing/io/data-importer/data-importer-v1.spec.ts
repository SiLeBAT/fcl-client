import { waitForAsync } from "@angular/core/testing";
import * as _ from "lodash";
import { Observable, of } from "rxjs";
import { FclData } from "../../data.model";
import { createInitialFclDataState } from "../../state/tracing.reducers";
import { Constants } from "../../util/constants";
import { JsonData, VERSION } from "../ext-data-model.v1";
import { DataImporterV1 } from "./data-importer-v1";
import fs from "fs";

function getAggregatedIds(...idArrays: string[][]): string[] {
    return _.uniq(([] as string[]).concat(...idArrays)).sort();
}

function checkElementTracSettingsCompleteness(fclData: FclData): void {
    const observed = {
        statTracIds: getAggregatedIds(
            fclData.tracingSettings.stations.map((s) => s.id),
        ),
        delTracIds: getAggregatedIds(
            fclData.tracingSettings.deliveries.map((d) => d.id),
        ),
    };
    const expected = {
        statTracIds: getAggregatedIds(
            fclData.fclElements.stations.map((s) => s.id),
            fclData.groupSettings.map((g) => g.id),
        ),
        delTracIds: getAggregatedIds(
            fclData.fclElements.deliveries.map((d) => d.id),
        ),
    };
    expect(observed).toEqual(expected);
}

class HttpClientMock {
    get(urlFilePath: string): Observable<object> {
        const localFilePath = `src${urlFilePath.substring(urlFilePath.search("/assets/"))}`;
        const data = JSON.parse(fs.readFileSync(localFilePath, "utf8"));
        return of(data);
    }
}

describe("DataImporterV1", () => {
    let dataImporterV1: DataImporterV1;

    beforeEach(waitForAsync(() => {
        const httpClientMock = new HttpClientMock();
        dataImporterV1 = new DataImporterV1(httpClientMock as any);
    }));

    it("should instantiate the dataImporterV1", () => {
        expect(dataImporterV1).toBeTruthy();
    });

    it("should add missing tracing entries for station/group/delivery element", async () => {
        const exampleDataPath: string =
            Constants.EXAMPLE_DATA_FILE_STRUCTURE[0].path;
        const localFilePath = `src/${exampleDataPath.substring(exampleDataPath.search("/assets/"))}`;
        const extData = JSON.parse(fs.readFileSync(localFilePath, "utf8"));
        // simulate no tracing settings in the external model
        extData.tracing = null;

        return dataImporterV1
            .importData(extData)
            .then(async (fclData) => {
                checkElementTracSettingsCompleteness(fclData);

                const allStatIds = ([] as string[]).concat(
                    fclData.fclElements.stations.map((s) => s.id),
                    fclData.groupSettings.map((g) => g.id),
                );
                // simulate only some missing element tracing setting entries in the external model
                extData.tracing = {
                    version: VERSION,
                    nodes: allStatIds
                        .map((statId) => ({
                            id: statId,
                            weight: 0,
                            killContamination: false,
                            crossContamination: false,
                            observed: false,
                        }))
                        .slice(0, allStatIds.length - 1),
                    deliveries: fclData.fclElements.deliveries
                        .map((d) => ({
                            id: d.id,
                            weight: 0,
                            killContamination: false,
                            crossContamination: false,
                            observed: false,
                        }))
                        .slice(0, fclData.fclElements.deliveries.length - 1),
                };

                return dataImporterV1.importData(extData);
            })
            .then((fclData) => {
                checkElementTracSettingsCompleteness(fclData);
            })
            .catch((error) => {
                throw error;
            });
    });
});
