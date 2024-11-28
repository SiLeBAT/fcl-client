import {
    ActiveChange,
    ActiveRecord,
    HistoryRecord,
    UtxCore,
    UtxData,
} from "./utx-model";

type UtxCoreKey = keyof Required<UtxCore>;
type ElementOf<T> = T extends Array<infer X> ? X : never;
type ActiveUtxCoreEntity<T extends UtxCoreKey = UtxCoreKey> = {
    [key in T]: ElementOf<Required<Required<UtxCore>[key]>["current"]>;
}[T];
export type UtxCoreMaps = {
    [key in UtxCoreKey]: Map<string, ActiveUtxCoreEntity<key>>;
};

function isCorrection<T extends { id: string }>(
    value: ActiveRecord<T> | HistoryRecord<T>,
): value is T & ActiveChange {
    return (value as ActiveChange).correctionOf !== undefined;
}

function createId2ObjectMap<T extends { id: string }>(
    entity:
        | { current?: ActiveRecord<T>[]; history?: HistoryRecord<T>[] }
        | undefined,
): Map<string, ActiveRecord<T>> {
    const activeItems = entity?.current || [];
    const historyItems = entity?.history || [];
    const id2ActiveDescendentMap = new Map(
        activeItems.map((item) => [item.id, item]),
    );
    const ignoredSplitIds = new Set<string>();
    activeItems.forEach((activeItem) => {
        id2ActiveDescendentMap.set(activeItem.id, activeItem);
        if (isCorrection(activeItem)) {
            activeItem.correctionOf.forEach((correctedItemId) => {
                if (ignoredSplitIds.has(correctedItemId)) {
                    return;
                }
                if (
                    id2ActiveDescendentMap.has(correctedItemId) &&
                    id2ActiveDescendentMap.get(correctedItemId) !== activeItem
                ) {
                    ignoredSplitIds.add(correctedItemId);
                    id2ActiveDescendentMap.delete(correctedItemId);
                } else {
                    id2ActiveDescendentMap.set(correctedItemId, activeItem);
                }
            });
        }
    });

    const reversedHistoryItems = historyItems.slice().reverse();
    reversedHistoryItems.forEach((historyItem) => {
        if (isCorrection(historyItem)) {
            if (!ignoredSplitIds.has(historyItem.id)) {
                const activeDescendent = id2ActiveDescendentMap.get(
                    historyItem.id,
                );
                if (activeDescendent !== undefined) {
                    historyItem.correctionOf.forEach((correctedItemId) => {
                        if (ignoredSplitIds.has(correctedItemId)) {
                            return;
                        }
                        if (
                            id2ActiveDescendentMap.has(correctedItemId) &&
                            id2ActiveDescendentMap.get(correctedItemId) !==
                                activeDescendent
                        ) {
                            ignoredSplitIds.add(correctedItemId);
                            id2ActiveDescendentMap.delete(correctedItemId);
                        } else {
                            id2ActiveDescendentMap.set(
                                correctedItemId,
                                activeDescendent,
                            );
                        }
                    });
                }
            } else {
                historyItem.correctionOf.forEach((correctedItemId) =>
                    ignoredSplitIds.add(correctedItemId),
                );
            }
        }
    });
    return id2ActiveDescendentMap;
}

export function createUtxCoreMaps(utxData: UtxData): UtxCoreMaps {
    return {
        activity: createId2ObjectMap(utxData.utxCore.activity),
        contact: createId2ObjectMap(utxData.utxCore.contact),
        fbo: createId2ObjectMap(utxData.utxCore.fbo),
        informationSource: createId2ObjectMap(
            utxData.utxCore.informationSource,
        ),
        investigation: createId2ObjectMap(utxData.utxCore.investigation),
        logisticUnit: createId2ObjectMap(utxData.utxCore.logisticUnit),
        lot: createId2ObjectMap(utxData.utxCore.lot),
        product: createId2ObjectMap(utxData.utxCore.product),
        registrationScheme: createId2ObjectMap(
            utxData.utxCore.registrationScheme,
        ),
        station: createId2ObjectMap(utxData.utxCore.station),
        tru: createId2ObjectMap(utxData.utxCore.tru),
    };
}
