import { Injectable } from '@angular/core';
import { ObservedType, StationData, GroupType, GroupMode } from '../data.model';
import {
    ContextMenuRequestContext, CyEdgeData, CyNodeData,
    GraphServiceData
} from './graph.model';
import _ from 'lodash';
import { MenuItemData } from './menu-item-data.model';
import { MenuItemStrings } from './menu.constants';
import { Subject } from 'rxjs';
import { LayoutService } from '../layout/layout.service';
import {
    ClearInvisibilitiesMSA, ClearOutbreakStationsMSA, ClearTraceMSA, MakeStationsInvisibleMSA,
    MarkStationsAsOutbreakMSA, SetStationCrossContaminationMSA, SetStationKillContaminationMSA, ShowDeliveryPropertiesMSA,
    ShowDeliveryTraceMSA, ShowStationPropertiesMSA, ShowStationTraceMSA
} from '../tracing.actions';
import { CollapseStationsMSA, ExpandStationsMSA, MergeStationsMSA, UncollapseStationsMSA } from '../grouping/grouping.actions';

interface ContextElements {
    nodeIds: string[];
    edgeIds: string[];
    stationIds: string[];
    deliveryIds: string[];
}

@Injectable({
    providedIn: 'root'
})
export class ContextMenuService {

    constructor(
        private layoutService: LayoutService
    ) {}

    private getContextElements(context: ContextMenuRequestContext, graphData: GraphServiceData): ContextElements {
        const isContextElementSelected =
            (context.nodeId && graphData.nodeSel[context.nodeId]) ||
            (context.edgeId && graphData.edgeSel[context.edgeId])
        ;

        const nodes: CyNodeData[] =
            isContextElementSelected ? graphData.nodeData.filter(n => n.selected) :
            context.nodeId ? [graphData.nodeData.find(n => n.id === context.nodeId)] :
            [];

        const edges: CyEdgeData[] =
            isContextElementSelected ? graphData.edgeData.filter(e => e.selected) :
            context.edgeId ? [graphData.edgeData.find(e => e.id === context.edgeId)] :
            [];

        return {
            nodeIds: nodes.map(n => n.id),
            edgeIds: edges.map(e => e.id),
            stationIds: nodes.map(n => n.station.id),
            deliveryIds: isContextElementSelected ?
                [].concat(...edges.map(e => e.deliveries.filter(d => d.selected).map(d => d.id))) :
                [].concat(...edges.map(e => e.deliveries.map(d => d.id)))
        };
    }

    getMenuData(
        context: { nodeId?: string, edgeId?: string },
        graphData: GraphServiceData, addLayoutOptions: boolean
    ): MenuItemData[] {
        const contextElements = this.getContextElements(context, graphData);

        if (contextElements.nodeIds.length === 0 && contextElements.edgeIds.length === 0) {
            return this.createGraphMenuData(graphData, addLayoutOptions);
        } else if (context.nodeId) {
            return this.createStationActions(contextElements, graphData, addLayoutOptions);
        } else if (context.edgeId) {
            return this.createDeliveryActions(contextElements, graphData);
        } else {
            return [];
        }
    }

    private createLayoutMenuData(graphData: GraphServiceData, nodeIds?: string[]): MenuItemData[] {
        nodeIds = nodeIds || graphData.nodeData.map(n => n.id);
        const layoutIsEnabled =
            nodeIds.length >= 2 ||
            (nodeIds.length === 0 && graphData.nodeData.length >= 2);


        const layoutMenuData: MenuItemData[] = this.layoutService.getLayoutMenuDataV2(graphData, nodeIds);

        return (
            layoutMenuData && layoutMenuData.length > 0 ?
                [{
                    ...MenuItemStrings.applyLayout,
                    disabled: !layoutIsEnabled,
                    children: layoutMenuData.slice()
                }] :
                []
        );
    }

    private createGraphMenuData(graphData: GraphServiceData, addLayoutOptions: boolean): MenuItemData[] {
        const deliveries = graphData.deliveries.filter(d =>
            !d.invisible &&
            !graphData.statMap[d.source].invisible &&
            !graphData.statMap[d.target].invisible
        );
        const stations = graphData.stations.filter(s => !s.invisible);

        return [].concat(
            addLayoutOptions ? this.createLayoutMenuData(graphData) : [],
            [
                {
                    ...MenuItemStrings.clearTrace,
                    disabled: !(
                        stations.some(s => s.observed !== ObservedType.NONE) ||
                        deliveries.some(d => d.observed !== ObservedType.NONE)
                    ),
                    action: new ClearTraceMSA({})
                },
                {
                    ...MenuItemStrings.clearOutbreakStations,
                    disabled: !stations.some(s => s.outbreak),
                    action: new ClearOutbreakStationsMSA({})
                },
                {
                    ...MenuItemStrings.clearInvisibility,
                    disabled: !(
                        graphData.stations.some(s => s.invisible) ||
                        graphData.deliveries.some(d => d.invisible)
                    ),
                    action: new ClearInvisibilitiesMSA({})
                },
                this.createCollapseStationsMenuItem(),
                this.createUncollapseStationsMenuItem(graphData)
            ]
        );
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

    private createStationActions(
        contextElements: ContextElements,
        graphData: GraphServiceData,
        addLayoutOptions: boolean
    ): MenuItemData[] {

        const contextStations: StationData[] = graphData.getStatById(contextElements.stationIds);
        const multipleStationsSelected = contextStations.length > 1;
        const selectedIds = contextStations.map(s => s.id);
        const allOutbreakStations = contextStations.every(s => s.outbreak);
        const allCrossContaminationStations = contextStations.every(s => s.crossContamination);
        const allKillContaminationStations = contextStations.every(s => s.killContamination);
        const allMetaStations = contextStations.every(s => s.contains && s.contains.length > 0);

        return [].concat(
            addLayoutOptions ? this.createLayoutMenuData(graphData, contextElements.stationIds) : [],
            [
                {
                    ...MenuItemStrings.showProperties,
                    disabled: multipleStationsSelected,
                    action: new ShowStationPropertiesMSA({
                        stationId: selectedIds[0],
                        hoverDeliveriesSubject: new Subject<string[]>()
                    })
                },
                this.createTraceMenuItemData(contextElements),
                {
                    ...(allOutbreakStations ? MenuItemStrings.unmarkOutbreakStations : MenuItemStrings.markOutbreakStations),
                    action: new MarkStationsAsOutbreakMSA({ stationIds: selectedIds, outbreak: !allOutbreakStations })
                },
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
                {
                    ...MenuItemStrings.makeStationsInvisible,
                    action: new MakeStationsInvisibleMSA({ stationIds: selectedIds })
                },
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
            }
        ];
    }

    private createTraceMenuItemData(contextElements: ContextElements): MenuItemData {
        const getAction = (type: ObservedType) => {
            if (contextElements.stationIds.length === 1) {
                return new ShowStationTraceMSA({
                    stationId: contextElements.stationIds[0],
                    observedType: type
                });
            } else if (contextElements.deliveryIds.length === 1) {
                return new ShowDeliveryTraceMSA({
                    deliveryId: contextElements.deliveryIds[0],
                    observedType: type
                });
            }
        };
        return {
            ...MenuItemStrings.setTrace,
            disabled: !getAction,
            children: [
                {
                    ...MenuItemStrings.forwardTrace,
                    action: getAction(ObservedType.FORWARD)
                },
                {
                    ...MenuItemStrings.backwardTrace,
                    action: getAction(ObservedType.BACKWARD)
                },
                {
                    ...MenuItemStrings.fullTrace,
                    action: getAction(ObservedType.FULL)
                }
            ]
        };
    }
}
