import { FclData, StationStoreData } from "../../../data.model";
import { joinNonEmptyElementsOrUndefined } from "../../../util/non-ui-utils";
import { FCL_STATION_PROPS, UTX_PROP_VALUES } from "./consts";
import { UtxCoreMaps } from "./create-core-maps";
import {
    createProperties,
    getRegistration,
    mergeCVsAndTreeTexts,
} from "./shared";
import { Contact, UtxData } from "./utx-model";

function createContactAddress(
    contact: Contact | undefined,
): string | undefined {
    const streetWithNo = joinNonEmptyElementsOrUndefined(
        [contact?.addressStreet, contact?.addressNumber],
        " ",
    );
    const zipWithCity = joinNonEmptyElementsOrUndefined(
        [contact?.addressZip, contact?.addressCity],
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
        );
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
                    id: FCL_STATION_PROPS.typeOfBusiness,
                    value: mergeCVsAndTreeTexts(
                        utxStation.stageCV,
                        utxStation.stageFreeText,
                        UTX_PROP_VALUES.other,
                    ),
                },
                {
                    id: FCL_STATION_PROPS.address,
                    value: createContactAddress(stationContact),
                },
                {
                    id: FCL_STATION_PROPS.country,
                    value: stationContact?.addressCountry,
                },
                {
                    id: FCL_STATION_PROPS.sector,
                    value: mergeCVsAndTreeTexts(
                        utxStation.sectorCV,
                        utxStation.sectorFreeText,
                        UTX_PROP_VALUES.other,
                    ),
                },
                {
                    id: FCL_STATION_PROPS.transportationMean,
                    value: mergeCVsAndTreeTexts(
                        utxStation.transportationMeanCV,
                        utxStation.transportationMeanFreeText,
                        UTX_PROP_VALUES.other,
                    ),
                },
                { id: FCL_STATION_PROPS.class, value: utxStation.class },
                {
                    id: FCL_STATION_PROPS.registrationNumber,
                    value: stationRegistration?.number,
                },
                {
                    id: FCL_STATION_PROPS.registrationType,
                    value: stationRegistration?.type,
                },
                {
                    id: FCL_STATION_PROPS.registeredAt,
                    value: stationRegistration?.registry,
                },
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
