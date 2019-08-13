import { Component, ElementRef, OnInit, ViewChild, OnDestroy, Output, EventEmitter } from '@angular/core';
import { MatMenuTrigger } from '@angular/material';
import { Store, Action } from '@ngrx/store';
import * as fromTracing from '@app/tracing/state/tracing.reducers';
import * as tracingActions from '../../tracing.actions';
import * as groupingActions from '../../grouping/grouping.actions';
import { Position, GroupType, GroupMode, ObservedType } from '../../data.model';
import { Cy, CyNode, CyEdge } from '../graph.model';
import { Subject } from 'rxjs';
import { LayoutService, LayoutActionTypes } from '@app/tracing/layout/layout.service';
import { MenuItemData } from '../menu-item-data.model';
import { MenuItemStrings } from '../menu.constants';
import { Utils } from '../../util/utils';

@Component({
    selector: 'fcl-graph-context-menu',
    templateUrl: './graph-context-menu.component.html'
})
export class GraphContextMenuComponent implements OnInit, OnDestroy {

    @ViewChild('graphMenuTrigger') graphMenuTrigger: MatMenuTrigger;
    @ViewChild('graphMenuTrigger', { read: ElementRef }) graphMenuTriggerElement: ElementRef;

    @Output() layoutAction = new EventEmitter<Action>();

    //noinspection JSUnusedGlobalSymbols
    constructor(
        private store: Store<fromTracing.State>,
        private layoutService: LayoutService,
        public elementRef: ElementRef
    ) {}

    ngOnInit() {
    }

    ngOnDestroy() {
    }

    performAction(action: Action) {
        if (action.type === LayoutActionTypes.LayoutAction) {
            this.layoutAction.emit(action);
        } else {
            this.store.dispatch(action);
        }
    }

    connect(cy: Cy, hoverDeliveriesSubject: Subject<string[]>) {
        // context menu open
        cy.on('cxttap', event => {
            const element = event.target;
            if (element === cy || element.isNode() || element.isEdge()) {

                const position: Position = {
                    x: event.originalEvent.offsetX,
                    y: event.originalEvent.offsetY
                };

                const layoutMenuData = !cy.autoungrabify() ? this.layoutService.getLayoutMenuData() : [];
                const menuData = this.getMenuData(
                    layoutMenuData,
                    cy,
                    element === cy ? null : element,
                    hoverDeliveriesSubject
                );

                this.graphMenuTrigger.menuData = { menuItems: menuData };
                Utils.openMenu(this.graphMenuTrigger, this.graphMenuTriggerElement, position);
            }
        });
    }

    private getMenuData(
        layoutMenuData: MenuItemData[],
        cy: Cy,
        contextGraphElement: CyNode | CyEdge,
        hoverDeliveriesSubject: Subject<string[]>
    ): MenuItemData[] {

        if (!contextGraphElement) {
            return this.createGraphMenuData(layoutMenuData);
        } else if (contextGraphElement.isNode()) {
            return this.createStationActions(cy, contextGraphElement as CyNode, hoverDeliveriesSubject);
        } else if (contextGraphElement.isEdge()) {
            return this.createDeliveryActions(contextGraphElement as CyEdge);
        } else {
            return [];
        }
    }

    private createGraphMenuData(layoutMenuData: MenuItemData[]): MenuItemData[] {
        return [].concat(
            (layoutMenuData && layoutMenuData.length > 0 ? [{
                ...MenuItemStrings.applyLayout,
                children: layoutMenuData.slice()
            }] : []),
            [
                {
                    ...MenuItemStrings.clearTrace,
                    action: new tracingActions.ClearTraceMSA({})
                },
                {
                    ...MenuItemStrings.clearOutbreakStations,
                    action: new tracingActions.ClearOutbreakStationsMSA({})
                },
                {
                    ...MenuItemStrings.clearInvisibility,
                    action: new tracingActions.ClearInvisibilitiesMSA({})
                },
                {
                    ...MenuItemStrings.collapseStations,
                    children: [
                        {
                            ...MenuItemStrings.collapseSources,
                            children: [
                                {
                                    ...MenuItemStrings.collapseSourcesWeightOnly,
                                    action : new groupingActions.CollapseStationsMSA({
                                        groupType: GroupType.SOURCE_GROUP,
                                        groupMode: GroupMode.WEIGHT_ONLY
                                    })
                                },
                                {
                                    ...MenuItemStrings.collapseSourcesProductAndWeight,
                                    action : new groupingActions.CollapseStationsMSA({
                                        groupType: GroupType.SOURCE_GROUP,
                                        groupMode: GroupMode.PRODUCT_AND_WEIGHT
                                    })
                                },
                                {
                                    ...MenuItemStrings.collapseSourcesLotAndWeight,
                                    action : new groupingActions.CollapseStationsMSA({
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
                                    action : new groupingActions.CollapseStationsMSA({
                                        groupType: GroupType.TARGET_GROUP,
                                        groupMode: GroupMode.WEIGHT_ONLY
                                    })
                                },
                                {
                                    ...MenuItemStrings.collapseTargetsProductAndWeight,
                                    action : new groupingActions.CollapseStationsMSA({
                                        groupType: GroupType.TARGET_GROUP,
                                        groupMode: GroupMode.PRODUCT_AND_WEIGHT
                                    })
                                },
                                {
                                    ...MenuItemStrings.collapseTargetsLotAndWeight,
                                    action : new groupingActions.CollapseStationsMSA({
                                        groupType: GroupType.TARGET_GROUP,
                                        groupMode: GroupMode.LOT_AND_WEIGHT
                                    })
                                }
                            ]
                        },
                        {
                            ...MenuItemStrings.collapseSimpleChains,
                            action : new groupingActions.CollapseStationsMSA({ groupType: GroupType.SIMPLE_CHAIN })
                        },
                        {
                            ...MenuItemStrings.collapseIsolatedClouds,
                            action : new groupingActions.CollapseStationsMSA({ groupType: GroupType.ISOLATED_GROUP })
                        }
                    ]
                },
                {
                    ...MenuItemStrings.uncollapseStations,
                    children: [
                        {
                            ...MenuItemStrings.uncollapseSources,
                            action : new groupingActions.UncollapseStationsMSA({ groupType: GroupType.SOURCE_GROUP })
                        },
                        {
                            ...MenuItemStrings.uncollapseTargets,
                            action : new groupingActions.UncollapseStationsMSA({ groupType: GroupType.TARGET_GROUP })
                        },
                        {
                            ...MenuItemStrings.uncollapseSimpleChains,
                            action : new groupingActions.UncollapseStationsMSA({ groupType: GroupType.SIMPLE_CHAIN })
                        },
                        {
                            ...MenuItemStrings.uncollapseIsolatedClouds,
                            action : new groupingActions.UncollapseStationsMSA({ groupType: GroupType.ISOLATED_GROUP })
                        }
                    ]
                }
            ]
        );
    }

    private createStationActions(cy: Cy, node: CyNode, hoverDeliveriesSubject: Subject<string[]>): MenuItemData[] {
        if (cy == null || node == null) {
            return [];
        }
        const selectedNodes = cy.nodes(':selected');
        const multipleStationsSelected = node.selected() && selectedNodes.size() > 1;
        const selectedIds = multipleStationsSelected ? selectedNodes.map(s => s.data().station.id) : [node.data().station.id];
        const allOutbreakStations = multipleStationsSelected ? selectedNodes.allAre('[?outbreak]') : node.data('outbreak');
        const allCrossContaminationStations = multipleStationsSelected
            ? selectedNodes.allAre('[?crossContamination]')
            : node.data('crossContamination');
        const allMetaStations =
            multipleStationsSelected ?
            selectedNodes.map(n => n.data().station.contains.length > 0).every(v => v) :
            node.data().station.contains.length > 0;

        return [
            {
                ...MenuItemStrings.showProperties,
                disabled: multipleStationsSelected,
                action: new tracingActions.ShowStationPropertiesMSA({
                    stationId: node.data().station.id,
                    hoverDeliveriesSubject: hoverDeliveriesSubject
                })
            },
            this.createTraceMenuItemData(node),
            {
                ...(allOutbreakStations ? MenuItemStrings.unmarkOutbreakStations : MenuItemStrings.markOutbreakStations),
                action: new tracingActions.MarkStationsAsOutbreakMSA({ stationIds: selectedIds, outbreak: !allOutbreakStations })
            },
            {
                ...(allCrossContaminationStations ?
                    MenuItemStrings.unsetStationCrossContamination :
                    MenuItemStrings.setStationCrossContamination),
                action: new tracingActions.SetStationCrossContaminationMSA({
                    stationIds: selectedIds,
                    crossContamination: !allCrossContaminationStations
                })
            },
            {
                ...MenuItemStrings.makeStationsInvisible,
                action: new tracingActions.MakeStationsInvisibleMSA({ stationIds: selectedIds })
            },
            {
                ...MenuItemStrings.mergeStations,
                disabled: !multipleStationsSelected,
                action: new groupingActions.MergeStationsMSA({ memberIds: selectedIds })
            },
            {
                ...MenuItemStrings.expandStations,
                disabled: !allMetaStations,
                action: new groupingActions.ExpandStationsMSA({ stationIds: selectedIds })
            }
        ];
    }

    private createDeliveryActions(edge: CyEdge): MenuItemData[] {
        const isMerged = edge.data().deliveries.length > 1;
        return [
            {
                ...MenuItemStrings.showProperties,
                disabled: isMerged,
                action: new tracingActions.ShowDeliveryPropertiesMSA({ deliveryId: edge.data().deliveries[0].id })
            },
            {
                ...this.createTraceMenuItemData(edge),
                disabled: isMerged
            }
        ];
    }

    private createTraceMenuItemData(element: CyNode | CyEdge): MenuItemData {
        const getAction = (type: ObservedType) => {
            if (element.isNode()) {
                return new tracingActions.ShowStationTraceMSA({
                    stationId: (element as CyNode).data().station.id,
                    observedType: type
                });
            } else {
                return new tracingActions.ShowDeliveryTraceMSA({
                    deliveryId: (element as CyEdge).data().deliveries[0].id,
                    observedType: type
                });
            }
        };
        return {
            ...MenuItemStrings.setTrace,
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
