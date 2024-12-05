import { PropertyEntry } from "@app/tracing/data.model";
import { Registration, RegistrationScheme } from "./utx-model";

type SimpleType = string | number | boolean;

export function getRegistration(
    registrations: Registration[],
    registrationSchemeMap: Map<string, RegistrationScheme>,
):
    | {
          number: string | undefined;
          type: string | undefined;
          registry: string | undefined;
      }
    | undefined {
    if (registrations.length === 0) {
        return undefined;
    }
    const referenceRegistration = registrations[0];
    return {
        number: referenceRegistration.registrationNumber,
        type: referenceRegistration.registrationType,
        registry: registrationSchemeMap.get(
            referenceRegistration.registrationScheme ?? "",
        )?.name,
    };
}

export function mergeCVAndTreeText(
    cvValue: string | undefined,
    freeTextValue: string | undefined,
    otherValue: string,
): string | undefined {
    if (cvValue === otherValue) {
        return freeTextValue;
    }
    return cvValue;
}

export function mergeCVsAndTreeTexts(
    cvValues: string[] | undefined,
    freeTextValues: string[] | undefined,
    otherValue: string,
): string[] | undefined {
    if (cvValues === undefined) {
        return undefined;
    }
    const definedFreeTextValues = freeTextValues || [];
    let freeTextIndex = 0;
    const mergedValues = cvValues.map((cvValue) =>
        cvValue === otherValue
            ? (definedFreeTextValues[freeTextIndex++] ?? "")
            : cvValue,
    );
    return mergedValues;
}

export function convertToSimpleType<T extends SimpleType>(
    value: T | T[] | undefined,
): T | undefined {
    if (Array.isArray(value)) {
        if (value.length > 0) {
            return value[0];
        }
        return undefined;
    }
    return value;
}

export function createProperties(
    entries: { id: string; value: SimpleType | SimpleType[] | undefined }[],
): PropertyEntry[] {
    const properties = entries.map((e) => ({
        name: e.id,
        value: convertToSimpleType(e.value),
    }));
    const propertiesWithValues = properties.filter(
        (p) => p.value !== undefined,
    ) as PropertyEntry[];
    return propertiesWithValues;
}
