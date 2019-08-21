import { Injectable } from '@angular/core';
import cytoscape from 'cytoscape';
import { Color, ObservedType } from '../data.model';
import { Utils } from '../util/non-ui-utils';
import { Constants } from '../util/constants';
import { GraphServiceData, Cy } from './graph.model';

interface Settings {
    nodeSize: number;
    fontSize: number;
}

enum GraphSize {
    SMALL, LARGE, HUGE
}

@Injectable({
    providedIn: 'root'
})
export class StyleService {

    constructor() { }

    createCyStyle(settings: Settings, graphData: GraphServiceData): any {
        const graphSize = this.getProperGraphSize(graphData);
        return this.createXGraphStyle(graphSize, settings.nodeSize, graphData.tracingResult.maxScore);
    }

    private getProperGraphSize(graphData: GraphServiceData): GraphSize {
        const MAX_STATION_NUMBER_FOR_SMALL_GRAPHS = 1000; // 300
        const MAX_DELIVERIES_NUMBER_FOR_SMALL_GRAPHS = 3000; // 500
        if (graphData.nodeData.length > MAX_STATION_NUMBER_FOR_SMALL_GRAPHS) {
            return GraphSize.HUGE;
        } else if (graphData.edgeData.length > MAX_DELIVERIES_NUMBER_FOR_SMALL_GRAPHS) {
            return GraphSize.LARGE;
        } else {
            return GraphSize.SMALL;
        }
    }

    updateCyNodeSize(cy: Cy, nodeSize: number, maxScore: number) {
        cy.nodes().style({
            ...this.createNodeSizeStyle(nodeSize, maxScore)
        });
    }

    updateCyFontSize(cy: Cy, fontSize: number) {
        if (cy) {
            cy.nodes().style({
                'font-size': Math.max(fontSize / cy.zoom(), fontSize)
            });
            cy.edges().style({
                'font-size': Math.max(fontSize / cy.zoom(), fontSize)
            });
        }
    }

    private createNodeSizeStyle(defaultNodeSize: number, maxScore: number): any {
        const nodeSizeMap: string = this.createNodeSizeMap(defaultNodeSize, maxScore);
        return {
            height: nodeSizeMap,
            width: nodeSizeMap
        };
    }

    private createXGraphStyle(graphSize: GraphSize, nodeSize: number, maxScore: number): any {
        let style = cytoscape
            .stylesheet()
            .selector('*')
            .style({
                'overlay-color': 'rgb(0, 0, 255)',
                'overlay-padding': 10,
                'overlay-opacity': e => (e.scratch('_active') ? 0.5 : 0.0)
            })
            .selector('node')
            .style({
                ...(graphSize !== GraphSize.HUGE ? { content: 'data(label)' } : {}),
                ...this.createNodeSizeStyle(nodeSize, maxScore),
                'background-color': 'rgb(255, 255, 255)',
                'border-width': 3,
                'border-color': 'rgb(0, 0, 0)',
                'text-valign': 'bottom',
                'text-halign': 'right',
                color: 'rgb(0, 0, 0)'
            })

            .selector('edge')
            .style({
                ...(graphSize !== GraphSize.HUGE ? { content: 'data(label)' } : {}),
                'target-arrow-shape': 'triangle-cross',
                'target-arrow-color': 'rgb(0, 0, 0)',
                'curve-style': graphSize === GraphSize.SMALL ? 'bezier' : 'straight',
                width: 1,
                'line-color': 'rgb(0, 0, 0)',
                'arrow-scale': 1.4
            })
            .selector('node:selected')
            .style({
                'background-color': 'rgb(128, 128, 255)',
                'border-width': 6,
                'border-color': 'rgb(0, 0, 255)',
                color: 'rgb(0, 0, 255)'
            })
            .selector('edge:selected')
            .style({
                width: 2
            })
            .selector('node[?contains]')
            .style({
                'border-width': 3
            })
            .selector('node:selected[?contains]')
            .style({
                'border-width': 3
            })
            .selector(':active')
            .style({
                'overlay-opacity': 0.5
            });

        const createSelector = (prop: string) => {
            if (prop === 'observed') {
                return '[' + prop + ' != "' + ObservedType.NONE + '"]';
            } else {
                return '[?' + prop + ']';
            }
        };

        const createNodeBackground = (colors: Color[]) => {
            const background = {};

            if (colors.length === 1) {
                background['background-color'] = Utils.colorToCss(colors[0]);
            } else {
                for (let i = 0; i < colors.length; i++) {
                    background['pie-' + (i + 1) + '-background-color'] = Utils.colorToCss(colors[i]);
                    background['pie-' + (i + 1) + '-background-size'] = 100 / colors.length;
                }
            }

            return background;
        };

        for (const combination of Utils.getAllCombinations(Constants.PROPERTIES_WITH_COLORS.toArray())) {
            const s = [];
            const c1 = [];
            const c2 = [];

            for (const prop of combination) {
                const color = Constants.PROPERTIES.get(prop).color;

                s.push(createSelector(prop));
                c1.push(color);
                c2.push(Utils.mixColors(color, { r: 0, g: 0, b: 255 }));
            }

            style = style.selector('node' + s.join('')).style(createNodeBackground(c1));
            style = style.selector('node:selected' + s.join('')).style(createNodeBackground(c2));
        }

        for (const prop of Constants.PROPERTIES_WITH_COLORS.toArray()) {
            style = style.selector('edge' + createSelector(prop)).style({
                'line-color': Utils.colorToCss(Constants.PROPERTIES.get(prop).color)
            });
        }

        return style;
    }

    private createNodeSizeMap(defaultNodeSize: number, maxScore: number): string {
        if (maxScore > 0) {
            const minNodeSize = defaultNodeSize / 1.5;
            const maxNodeSize = defaultNodeSize * 1.5;
            return 'mapData(score, 0, ' + maxScore + ', ' + minNodeSize + ',' + maxNodeSize + ')';
        } else {
            return defaultNodeSize.toString();
        }
    }
}
