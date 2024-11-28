import { DeliveryId, DeliveryStoreData, FclData } from "../../../data.model";
import {
    areSetsEqual,
    removeUndefined,
    unionOfSets,
} from "../../../util/non-ui-utils";
import { UtxCoreMaps } from "./create-core-maps";
import { createProperties } from "./shared";
import { Activity, Lot, Station, Tru, UtxData } from "./utx-model";

interface Delivery {
    lot: Lot;
    fromTru: Tru;
    toTru: Tru;
    fromStation: Station;
    toStation: Station;
    outDate?: string;
    inDate?: string;
}

interface DeliveriesAndRecipes {
    deliveries: Delivery[];
    truRecipes: Map<Tru, Set<Tru>>;
}

const DELIVERY_PROPS = {
    amount: "amount",
    amountNumber: "amountNumber",
    amountUnit: "amountUnit",
    lotAmount: "lotAmount",
    lotAmountNumber: "lotAmountNumber",
    lotAmountUnit: "lotAmountUnit",
} as const;

function getTrus(
    arr: { truIds?: string[] }[] | undefined,
    coreMaps: UtxCoreMaps,
): Tru[] {
    return (arr ?? [])
        .filter((item) => item.truIds)
        .map((item) =>
            (item.truIds ?? []).map((truId) => coreMaps.tru.get(truId)!),
        )
        .flat();
}

function getDeliveriesAndRecipes(
    activities: Activity[],
    coreMaps: UtxCoreMaps,
): DeliveriesAndRecipes {
    const deliveries: Delivery[] = [];
    const truRecipes = new Map<Tru, Set<Tru>>();

    for (const activity of activities) {
        const inTrus = getTrus(activity.truInput, coreMaps);
        const outTrus = getTrus(activity.truOutput, coreMaps);
        if (
            inTrus.some((tru) => tru.stationId === undefined) ||
            outTrus.some((tru) => tru.stationId === undefined)
        ) {
            // Activity is ignored because of missing tru station assignment(s).
            continue;
        }
        if (
            inTrus.some((tru) => tru.lotId === undefined) ||
            outTrus.some((tru) => tru.lotId === undefined)
        ) {
            // Activity is ignored because it contains (a) tru(s) not assigned to a lot.
            continue;
        }

        const inTruLotIds = new Set(inTrus.map((tru) => tru.lotId!));
        const outTruLotIds = new Set(outTrus.map((tru) => tru.lotId!));

        const inTruStatIds = new Set(inTrus.map((tru) => tru.stationId));
        const outTruStatIds = new Set(outTrus.map((tru) => tru.stationId));

        const isRelocation = !areSetsEqual(inTruStatIds, outTruStatIds);

        if (isRelocation) {
            // could be transport, load, unload, other
            Array.from(unionOfSets(inTruLotIds, outTruLotIds)).forEach(
                (lotId) => {
                    const lotInTrus = inTrus.filter(
                        (tru) => tru.lotId === lotId,
                    );
                    const lotOutTrus = outTrus.filter(
                        (tru) => tru.lotId === lotId,
                    );
                    lotOutTrus.forEach((outTru) => {
                        lotInTrus.forEach((inTru) => {
                            deliveries.push({
                                inDate: activity.activityEnd,
                                outDate: activity.activityStart,
                                lot: coreMaps.lot.get(lotId)!,
                                fromStation: coreMaps.station.get(
                                    inTru.stationId!,
                                )!,
                                toStation: coreMaps.station.get(
                                    outTru.stationId!,
                                )!,
                                fromTru: inTru,
                                toTru: outTru,
                            });
                        });
                    });
                },
            );
        } else if (inTrus.length > 0 && outTrus.length > 0) {
            outTrus.forEach((outTru) => {
                const ingredientTrus = truRecipes.get(outTru);
                if (ingredientTrus) {
                    truRecipes.set(
                        outTru,
                        unionOfSets(ingredientTrus, new Set(inTrus)),
                    );
                } else {
                    truRecipes.set(outTru, new Set(inTrus));
                }
            });
        }
    }
    return {
        deliveries: deliveries,
        truRecipes: truRecipes,
    };
}

function getAggregatedAmount(
    number: number | undefined,
    unit: string | undefined,
): string | undefined {
    return number === undefined
        ? undefined
        : unit === undefined
          ? `${number}`
          : `${number} ${unit}`;
}

function getTru2AncestorsMap(truRecipes: Map<Tru, Set<Tru>>): Map<Tru, Tru[]> {
    const tru2Ancestors = new Map<Tru, Tru[]>();
    truRecipes.forEach((ingredients, productTru) => {
        let ancestors = ingredients;
        let trusToBeTraversed = ancestors;
        while (trusToBeTraversed.size > 0) {
            trusToBeTraversed = unionOfSets(
                ...removeUndefined(
                    Array.from(trusToBeTraversed).map((tru) =>
                        truRecipes.get(tru),
                    ),
                ),
            );
            ancestors = unionOfSets(ancestors, trusToBeTraversed);
        }
        tru2Ancestors.set(productTru, Array.from(ancestors));
    });
    return tru2Ancestors;
}

export function applyUtxDeliveries(
    utxData: UtxData,
    fclData: FclData,
    coreMaps: UtxCoreMaps,
): void {
    const { deliveries, truRecipes } = getDeliveriesAndRecipes(
        utxData.utxCore.activity?.current ?? [],
        coreMaps,
    );

    const delId2Delivery = new Map<DeliveryId, Delivery>();
    const id2FclStation = new Map(
        fclData.fclElements.stations.map((s) => [s.id, s]),
    );

    const fclDeliveries: DeliveryStoreData[] = deliveries.map(
        (delivery, index) => {
            const product = coreMaps.product.get(delivery.lot.productId!)!;

            const fclDelivery: DeliveryStoreData = {
                id: `D${index}`,
                name: product.brandName,
                lot: delivery.lot.lotIdentifier,
                dateIn: delivery.inDate,
                dateOut: delivery.outDate,
                source: delivery.fromStation!.id,
                target: delivery.toStation!.id,
                properties: createProperties([
                    {
                        id: DELIVERY_PROPS.amount,
                        value: getAggregatedAmount(
                            delivery.toTru.netAmountQuantity,
                            delivery.toTru.netAmountUnit,
                        ),
                    },
                    {
                        id: DELIVERY_PROPS.amountNumber,
                        value: delivery.toTru.netAmountQuantity,
                    },
                    {
                        id: DELIVERY_PROPS.amountUnit,
                        value: delivery.toTru.netAmountUnit,
                    },
                    {
                        id: DELIVERY_PROPS.lotAmount,
                        value: getAggregatedAmount(
                            delivery.lot.netAmountQuantity,
                            delivery.lot.netAmountUnit,
                        ),
                    },
                    {
                        id: DELIVERY_PROPS.lotAmountNumber,
                        value: delivery.lot.netAmountQuantity,
                    },
                    {
                        id: DELIVERY_PROPS.lotAmountUnit,
                        value: delivery.lot.netAmountUnit,
                    },
                ]),
            };
            delId2Delivery.set(fclDelivery.id, delivery);
            id2FclStation
                .get(fclDelivery.source)
                ?.outgoing.push(fclDelivery.id);
            id2FclStation
                .get(fclDelivery.target)
                ?.incoming.push(fclDelivery.id);
            return fclDelivery;
        },
    );

    const tru2AncestorsMap = getTru2AncestorsMap(truRecipes);
    fclData.fclElements.stations.forEach((fclStation) => {
        const tru2DeliverId = new Map(
            fclStation.incoming.map((inDelId) => [
                delId2Delivery.get(inDelId)!.toTru,
                inDelId,
            ]),
        );

        fclStation.outgoing.forEach((outDelId) => {
            const outgoingTru = delId2Delivery.get(outDelId)!.fromTru;
            const inDelIds = removeUndefined(
                (tru2AncestorsMap.get(outgoingTru) ?? []).map((tru) =>
                    tru2DeliverId.get(tru),
                ),
            );
            inDelIds.forEach((inDelId) =>
                fclStation.connections.push({
                    source: inDelId,
                    target: outDelId,
                }),
            );
        });
    });
    fclData.fclElements.deliveries = fclDeliveries;
}
