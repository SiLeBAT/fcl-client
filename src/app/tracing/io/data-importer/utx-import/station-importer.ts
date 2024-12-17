import { FclData, StationStoreData } from "../../../data.model";
import { joinNonEmptyElementsOrUndefined } from "../../../util/non-ui-utils";
import { UtxCoreMaps } from "./create-core-maps";
import {
    createProperties,
    getRegistration,
    mergeCVsAndTreeTexts,
} from "./shared";
import { Contact, UtxData } from "./utx-model";

function createContactAddress(contact: Contact): string | undefined {
    const streetWithNo = joinNonEmptyElementsOrUndefined(
        [contact.addressStreet, contact.addressNumber],
        " ",
    );
    const zipWithCity = joinNonEmptyElementsOrUndefined(
        [contact.addressZip, contact.addressCity],
        " ",
    );
    const address = joinNonEmptyElementsOrUndefined(
        [streetWithNo, zipWithCity],
        ", ",
    );
    return address;
}

export function applyUtxStationsToFclData(
    utxData: UtxData,
    fclData: FclData,
    coreMaps: UtxCoreMaps,
): FclData {
    const utxStations = utxData.utxCore.station?.current ?? [];
    const contactMap = coreMaps.contact;
    const registrationSchemeMap = coreMaps.registrationScheme;
    const fclStations: StationStoreData[] = utxStations.map((utxStation) => {
        const stationContact = contactMap.get(
            utxStation.stationNameAddress ?? "",
        )!;
        const stationRegistration = getRegistration(
            utxStation.registrations ?? [],
            registrationSchemeMap,
        );
        return {
            id: utxStation.id,
            name: stationContact?.name,
            lat: stationContact?.latitude,
            lon: stationContact?.longitude,
            incoming: [],
            outgoing: [],
            connections: [],
            properties: createProperties([
                {
                    id: "typeOfBusiness",
                    value: mergeCVsAndTreeTexts(
                        utxStation.stageCV,
                        utxStation.stageFreeText,
                        "other",
                    ),
                },
                { id: "address", value: createContactAddress(stationContact) },
                { id: "country", value: stationContact.addressCountry },
                {
                    id: "sector",
                    value: mergeCVsAndTreeTexts(
                        utxStation.sectorCV,
                        utxStation.sectorFreeText,
                        "other",
                    ),
                },
                {
                    id: "transportationMean",
                    value: mergeCVsAndTreeTexts(
                        utxStation.transportationMeanCV,
                        utxStation.transportationMeanFreeText,
                        "other",
                    ),
                },
                { id: "class", value: utxStation.class },
                {
                    id: "registrationNumber",
                    value: stationRegistration?.number,
                },
                { id: "registrationType", value: stationRegistration?.type },
                { id: "registeredAt", value: stationRegistration?.registry },
            ]),
        };
    });
    return {
        ...fclData,
        fclElements: {
            ...fclData.fclElements,
            stations: fclStations,
        },
    };
}
