import { Injectable } from '@angular/core';
import {
    ObservedType, StationData, GroupType,
    GroupMode, StationId, DeliveryId
} from '../data.model';
import {
    ContextMenuRequestContext, CyEdgeData, CyNodeData,
    EdgeId,
    GraphServiceData,
    NodeId
} from './graph.model';
import * as _ from 'lodash';
import { MenuItemData } from './menu-item-data.model';
import { MenuItemStrings } from './menu.constants';
import {
    ClearInvisibilitiesMSA, ClearTraceMSA,
    MarkElementsAsOutbreakMSA, SetStationCrossContaminationMSA,
    SetStationKillContaminationMSA, ShowDeliveryPropertiesMSA,
    ShowStationPropertiesMSA,
    ShowElementsTraceMSA,
    MakeElementsInvisibleMSA,
    ClearOutbreaksMSA} from '../tracing.actions';
import { CollapseStationsMSA, ExpandStationsMSA, MergeStationsMSA, UncollapseStationsMSA } from '../grouping/grouping.actions';
import { Action } from '@ngrx/store';
import { LayoutOption } from './cy-graph/interactive-cy-graph';
import { LayoutName } from './cy-graph/cy-graph';
import {
    LAYOUT_BREADTH_FIRST, LAYOUT_CIRCLE, LAYOUT_CONCENTRIC, LAYOUT_CONSTRAINT_BASED, LAYOUT_DAG, LAYOUT_FARM_TO_FORK,
    LAYOUT_FRUCHTERMAN, LAYOUT_GRID, LAYOUT_RANDOM, LAYOUT_SPREAD
} from './cy-graph/cy.constants';
import { concat } from '../util/non-ui-utils';

interface ContextElements {
    refNodeId: NodeId | undefined;
    refEdgeId: EdgeId | undefined;
    refStationId: StationId | undefined;
    refDeliveryIds: DeliveryId[] | undefined;
    nodeIds: string[];
    edgeIds: string[];
    stationIds: string[];
    deliveryIds: string[];
}

export enum LayoutActionTypes {
    LayoutAction = '[Tracing] Layout'
}

export class LayoutAction implements Action {
    readonly type = LayoutActionTypes.LayoutAction;

    constructor(public payload: { layoutName: LayoutName; nodeIds: string[] }) {}
}

@Injectable({
    providedIn: 'root'
})
export class ContextMenuService {

    private static readonly LayoutManagerLabel: Record<LayoutName, string> = {
        [LAYOUT_FRUCHTERMAN]: 'Fruchterman-Reingold',
        [LAYOUT_FARM_TO_FORK]: 'Farm-to-fork',
        [LAYOUT_CONSTRAINT_BASED]: 'Constraint-Based',
        [LAYOUT_RANDOM]: 'Random',
        [LAYOUT_GRID]: 'Grid',
        [LAYOUT_CIRCLE]: 'Circle',
        [LAYOUT_CONCENTRIC]: 'Concentric',
        [LAYOUT_BREADTH_FIRST]: 'Breadth-first',
        [LAYOUT_SPREAD]: 'Spread',
        [LAYOUT_DAG]: 'Directed acyclic graph'
    };

    getContextElements(context: ContextMenuRequestContext, graphData: GraphServiceData): ContextElements {
        const isContextElementSelected =
            (context.nodeId && graphData.nodeSel[context.nodeId]) ||
            (context.edgeId && graphData.edgeSel[context.edgeId])
        ;

        const nodes: CyNodeData[] =
            isContextElementSelected ? graphData.nodeData.filter(n => n.selected) :
                context.nodeId ? [graphData.nodeData.find(n => n.id === context.nodeId)!] :
                    [];

        const edges: CyEdgeData[] =
            isContextElementSelected ? graphData.edgeData.filter(e => e.selected) :
                context.edgeId ? [graphData.edgeData.find(e => e.id === context.edgeId)!] :
                    [];

        return {
            refNodeId: context.nodeId,
            refEdgeId: context.edgeId,
            refStationId: context.nodeId === undefined ? undefined :
                graphData.idToNodeMap[context.nodeId].station.id,
            refDeliveryIds:
                context.edgeId === undefined ? undefined :
                    graphData.edgeData.find(d => d.id === context.edgeId)!.deliveries.map(d => d.id),
            nodeIds: nodes.map(n => n.id),
            edgeIds: edges.map(e => e.id),
            stationIds: nodes.map(n => n.station.id),
            deliveryIds: isContextElementSelected ?
                concat(...edges.map(e => e.deliveries.filter(d => d.selected).map(d => d.id))) :
                concat(...edges.map(e => e.deliveries.map(d => d.id)))
        };
    }

    getMenuData(
        context: ContextMenuRequestContext,
        graphData: GraphServiceData,
        layoutOptions: LayoutOption[] | null
    ): MenuItemData[] {
        const contextElements = this.getContextElements(context, graphData);

        if (contextElements.nodeIds.length === 0 && contextElements.edgeIds.length === 0) {
            return this.createGraphMenuData(graphData, layoutOptions);
        } else if (context.nodeId !== undefined) {
            return this.createStationActions(contextElements, graphData, layoutOptions);
        } else if (context.edgeId !== undefined) {
            return this.createDeliveryActions(contextElements, graphData);
        } else {
            return [];
        }
    }

    private createLayoutMenuData(layoutOptions: LayoutOption[], nodesToLayout: NodeId[]): MenuItemData[] {
        const layoutIsEnabled = layoutOptions.some(options => !options.disabled);

        return [{
            ...MenuItemStrings.applyLayout,
            disabled: !layoutIsEnabled,
            children: layoutOptions.map(options => ({
                ...options,
                displayName: ContextMenuService.LayoutManagerLabel[options.name],
                action: new LayoutAction({ layoutName: options.name, nodeIds: nodesToLayout })
            }))
        }];
    }

    private createGraphMenuData(graphData: GraphServiceData, layoutOptions: LayoutOption[] | null): MenuItemData[] {
        const deliveries = graphData.deliveries.filter(d =>
            !d.invisible &&
            !graphData.statMap[d.source].invisible &&
            !graphData.statMap[d.target].invisible
        );
        const stations = graphData.stations.filter(s => !s.invisible);

        return concat(
            layoutOptions !== null ? this.createLayoutMenuData(layoutOptions, graphData.nodeData.map(n => n.id)) : [],
            [
                {
                    ...MenuItemStrings.clearTrace,
                    disabled: !(
                        stations.some(s => s.observed !== ObservedType.NONE) ||
                        deliveries.some(d => d.observed !== ObservedType.NONE)
                    ),
                    action: new ClearTraceMSA()
                },
                this.createClearOutbreaksMenuItemData(graphData),
                this.createClearInvisibilitiesMenuItemData(graphData),
                this.createCollapseStationsMenuItem(),
                this.createUncollapseStationsMenuItem(graphData)
            ]
        );
    }

    private createClearOutbreaksMenuItemData(graphData: GraphServiceData): MenuItemData {
        const someStationIsAnOutbreak = graphData.stations.some(s => s.outbreak);
        const someDeliveryIsAnOutbreak = graphData.deliveries.some(d => d.outbreak);
        return {
            ...MenuItemStrings.clearOutbreaks,
            disabled: !(someStationIsAnOutbreak || someDeliveryIsAnOutbreak),

            children: [
                {
                    ...MenuItemStrings.clearOutbreakStations,
                    disabled: !someStationIsAnOutbreak,
                    action: new ClearOutbreaksMSA({ clearStationOutbreaks: true, clearDeliveryOutbreaks: false })
                },
                {
                    ...MenuItemStrings.clearOutbreakDeliveries,
                    disabled: !someDeliveryIsAnOutbreak,
                    action: new ClearOutbreaksMSA({ clearStationOutbreaks: false, clearDeliveryOutbreaks: true })
                },
                {
                    ...MenuItemStrings.clearAllOutbreaks,
                    action: new ClearOutbreaksMSA({ clearStationOutbreaks: true, clearDeliveryOutbreaks: true })
                }
            ]
        };
    }

    private createClearInvisibilitiesMenuItemData(graphData: GraphServiceData): MenuItemData {
        const someStationIsExpInvisible = graphData.stations.some(s => s.expInvisible);
        const someDeliveryIsExpInvisible = graphData.deliveries.some(d => d.expInvisible);
        return {
            ...MenuItemStrings.clearInvisibility,
            disabled: !(someStationIsExpInvisible || someDeliveryIsExpInvisible),

            children: [
                {
                    ...MenuItemStrings.clearInvisibleStations,
                    disabled: !someStationIsExpInvisible,
                    action: new ClearInvisibilitiesMSA({ clearStationInvs: true, clearDeliveryInvs: false })
                },
                {
                    ...MenuItemStrings.clearInvisibleDeliveries,
                    disabled: !someDeliveryIsExpInvisible,
                    action: new ClearInvisibilitiesMSA({ clearStationInvs: false, clearDeliveryInvs: true })
                },
                {
                    ...MenuItemStrings.clearInvisibleElements,
                    action: new ClearInvisibilitiesMSA({ clearStationInvs: true, clearDeliveryInvs: true })
                }
            ]
        };
    }

    private createUncollapseStationsMenuItem(graphData: GraphServiceData): MenuItemData {
        const isSourceGroupAvailable = graphData.stations.some(s => s.groupType === GroupType.SOURCE_GROUP);
        const isTargetGroupAvailable = graphData.stations.some(s => s.groupType === GroupType.TARGET_GROUP);
        const isSimpleChainAvailable = graphData.stations.some(s => s.groupType === GroupType.SIMPLE_CHAIN);
        const isIsolatedGroupAvailable = graphData.stations.some(s => s.groupType === GroupType.ISOLATED_GROUP);
        return {
            ...MenuItemStrings.uncollapseStations,
            disabled: !(
                isSourceGroupAvailable || isTargetGroupAvailable || isSimpleChainAvailable ||
                isIsolatedGroupAvailable
            ),
            children: [
                {
                    ...MenuItemStrings.uncollapseSources,
                    action : new UncollapseStationsMSA({ groupType: GroupType.SOURCE_GROUP }),
                    disabled: !isSourceGroupAvailable
                },
                {
                    ...MenuItemStrings.uncollapseTargets,
                    action : new UncollapseStationsMSA({ groupType: GroupType.TARGET_GROUP }),
                    disabled: !isTargetGroupAvailable
                },
                {
                    ...MenuItemStrings.uncollapseSimpleChains,
                    action : new UncollapseStationsMSA({ groupType: GroupType.SIMPLE_CHAIN }),
                    disabled: !isSimpleChainAvailable
                },
                {
                    ...MenuItemStrings.uncollapseIsolatedClouds,
                    action : new UncollapseStationsMSA({ groupType: GroupType.ISOLATED_GROUP }),
                    disabled: !isIsolatedGroupAvailable
                }
            ]
        };
    }

    private createCollapseStationsMenuItem(): MenuItemData {
        return {
            ...MenuItemStrings.collapseStations,
            children: [
                {
                    ...MenuItemStrings.collapseSources,
                    children: [
                        {
                            ...MenuItemStrings.collapseSourcesWeightOnly,
                            action : new CollapseStationsMSA({
                                groupType: GroupType.SOURCE_GROUP,
                                groupMode: GroupMode.WEIGHT_ONLY
                            })
                        },
                        {
                            ...MenuItemStrings.collapseSourcesProductAndWeight,
                            action : new CollapseStationsMSA({
                                groupType: GroupType.SOURCE_GROUP,
                                groupMode: GroupMode.PRODUCT_AND_WEIGHT
                            })
                        },
                        {
                            ...MenuItemStrings.collapseSourcesLotAndWeight,
                            action : new CollapseStationsMSA({
                                groupType: GroupType.SOURCE_GROUP,
                                groupMode: GroupMode.LOT_AND_WEIGHT
                            })
                        }
                    ]
                },
                {
                    ...MenuItemStrings.collapseTargets,
                    children: [
                        {
                            ...MenuItemStrings.collapseTargetsWeightOnly,
                            action : new CollapseStationsMSA({
                                groupType: GroupType.TARGET_GROUP,
                                groupMode: GroupMode.WEIGHT_ONLY
                            })
                        },
                        {
                            ...MenuItemStrings.collapseTargetsProductAndWeight,
                            action : new CollapseStationsMSA({
                                groupType: GroupType.TARGET_GROUP,
                                groupMode: GroupMode.PRODUCT_AND_WEIGHT
                            })
                        },
                        {
                            ...MenuItemStrings.collapseTargetsLotAndWeight,
                            action : new CollapseStationsMSA({
                                groupType: GroupType.TARGET_GROUP,
                                groupMode: GroupMode.LOT_AND_WEIGHT
                            })
                        }
                    ]
                },
                {
                    ...MenuItemStrings.collapseSimpleChains,
                    action : new CollapseStationsMSA({ groupType: GroupType.SIMPLE_CHAIN })
                },
                {
                    ...MenuItemStrings.collapseIsolatedClouds,
                    action : new CollapseStationsMSA({ groupType: GroupType.ISOLATED_GROUP })
                }
            ]
        };
    }

    private createMakeInvisibleItemData(contextElements: ContextElements): MenuItemData {
        return {
            ...MenuItemStrings.makeElementsInvisible,
            action: new MakeElementsInvisibleMSA({
                stations: contextElements.stationIds,
                deliveries: contextElements.deliveryIds
            })
        };
    }

    private createMarkAsOutbreakItemData(contextElements: ContextElements, graphData: GraphServiceData): MenuItemData {
        const allContextStationsAreOutbreaks = graphData.getStatById(contextElements.stationIds).every(s => s.outbreak);
        const allContextDeliveriesAreOutbreaks = graphData.getDelById(contextElements.deliveryIds).every(d => d.outbreak);
        const allContextElementsAreOutbreaks = allContextStationsAreOutbreaks && allContextDeliveriesAreOutbreaks;
        return {
            ...(allContextElementsAreOutbreaks ? MenuItemStrings.unmarkOutbreaks :MenuItemStrings.markOutbreaks),
            action: new MarkElementsAsOutbreakMSA({
                stationIds: contextElements.stationIds,
                deliveryIds: contextElements.deliveryIds,
                outbreak: !allContextElementsAreOutbreaks
            })
        };
    }

    private createStationActions(
        contextElements: ContextElements,
        graphData: GraphServiceData,
        layoutOptions: LayoutOption[] | null
    ): MenuItemData[] {

        const contextStations: StationData[] = graphData.getStatById(contextElements.stationIds);
        const multipleStationsSelected = contextStations.length > 1;
        const selectedIds = contextStations.map(s => s.id);
        const allCrossContaminationStations = contextStations.every(s => s.crossContamination);
        const allKillContaminationStations = contextStations.every(s => s.killContamination);
        const allMetaStations = contextStations.every(s => s.contains && s.contains.length > 0);

        return concat(
            layoutOptions !== null ? this.createLayoutMenuData(layoutOptions, contextElements.nodeIds) : [],
            [
                {
                    ...MenuItemStrings.showProperties,
                    disabled: multipleStationsSelected,
                    action: new ShowStationPropertiesMSA({ stationId: selectedIds[0] })
                },
                this.createTraceMenuItemData(contextElements),
                this.createMarkAsOutbreakItemData(contextElements, graphData),
                {
                    ...(allCrossContaminationStations ?
                        MenuItemStrings.unsetStationCrossContamination :
                        MenuItemStrings.setStationCrossContamination),
                    action: new SetStationCrossContaminationMSA({
                        stationIds: selectedIds,
                        crossContamination: !allCrossContaminationStations
                    })
                },
                {
                    ...(allKillContaminationStations ?
                        MenuItemStrings.unsetStationKillContamination :
                        MenuItemStrings.setStationKillContamination),
                    action: new SetStationKillContaminationMSA({
                        stationIds: selectedIds,
                        killContamination: !allKillContaminationStations
                    })
                },
                this.createMakeInvisibleItemData(contextElements),
                {
                    ...MenuItemStrings.mergeStations,
                    disabled: !multipleStationsSelected,
                    action: new MergeStationsMSA({ memberIds: selectedIds })
                },
                {
                    ...MenuItemStrings.expandStations,
                    disabled: !allMetaStations,
                    action: new ExpandStationsMSA({ stationIds: selectedIds })
                }
            ]
        );
    }

    private createDeliveryActions(contextElements: ContextElements, graphData: GraphServiceData): MenuItemData[] {
        return [
            {
                ...MenuItemStrings.showProperties,
                action: new ShowDeliveryPropertiesMSA({ deliveryIds: contextElements.deliveryIds })
            },
            {
                ...this.createTraceMenuItemData(contextElements)
            },
            this.createMarkAsOutbreakItemData(contextElements, graphData),
            this.createMakeInvisibleItemData(contextElements)
        ];
    }

    private createTraceMenuItemData(contextElements: ContextElements): MenuItemData {
        const getAction = (type: ObservedType) => new ShowElementsTraceMSA({
            stationIds: contextElements.stationIds,
            deliveryIds: contextElements.deliveryIds,
            observedType: type
        });

        return {
            ...MenuItemStrings.setTrace,
            children: [
                {
                    ...MenuItemStrings.forwardTrace,
                    action: getAction === null ? undefined : getAction(ObservedType.FORWARD)
                },
                {
                    ...MenuItemStrings.backwardTrace,
                    action: getAction === null ? undefined : getAction(ObservedType.BACKWARD)
                },
                {
                    ...MenuItemStrings.fullTrace,
                    action: getAction === null ? undefined : getAction(ObservedType.FULL)
                }
            ]
        };
    }
}
