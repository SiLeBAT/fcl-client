// implementation according to:
// according to http://publications.lib.chalmers.se/records/fulltext/161388.pdf
import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './data_structures';
import {removeCycles} from './cycle_remover';
import {assignLayers} from './layer_assigner';
import {BusinessTypeRanker} from './business_type_ranker';
import {scaleToSize } from './shared';
import {sortAndPosition} from './vertex_sorter_and_positioner';

export function FarmToForkLayout(options) {
    this.options = options;
}

function getDateNumber(date: Date): number {
    return date.getMilliseconds() + date.getSeconds() * 1000 + date.getMinutes() * 60000 + date.getHours() * 3600000;
}

function getElapsedTime(dateStart: Date, dateEnd: Date): number {
    return getDateNumber(dateEnd) - getDateNumber(dateStart);
}

FarmToForkLayout.prototype.run = function () {
    new FarmToForkLayoutClass(this).run();
};

class FarmToForkLayoutClass {

    private static DEFAULTS = {
        fit: true,
        padding: 40
    };

    private layout: any;
    private options: any;

    constructor(layout: any) {
        this.layout = layout;
        this.options = {};

        for (const key of Object.keys(layout.options)) {
            this.options[key] = layout.options[key];
        }

        for (const key of Object.keys(FarmToForkLayoutClass.DEFAULTS)) {
            if (!this.options.hasOwnProperty(key)) {
                this.options[key] = FarmToForkLayoutClass.DEFAULTS[key];
            }
        }
    }

    run() {
        const cy = this.options.cy;
        const width: number = cy.width();
        const height: number = cy.height();
        const graph = new Graph();
        const vertices: Map<string, Vertex> = new Map();
        const typeRanker: BusinessTypeRanker = new BusinessTypeRanker([], [], []);

        cy.nodes().forEach(node => {
            const v: Vertex = new Vertex;
            v.typeCode = typeRanker.getBusinessTypeCode(node['data']['typeOfBusiness']);
            v.size = node.height();
            v.name = node.data('name');
            vertices.set(node.id(), v);
            graph.insertVertex(v);
        });

        const vertexDistance: number = Math.min(...graph.vertices.map(v => v.size)) / 2;
        cy.edges().forEach(edge => {
            graph.insertEdge(vertices.get(edge.source().id()), vertices.get(edge.target().id()));
        });

        const layoutManager: FarmToForkLayouter = new FarmToForkLayouter(graph, typeRanker);

        layoutManager.layout(width, height, vertexDistance);

        cy.nodes().layoutPositions(this.layout, this.options, node => {
            const vertex = vertices.get(node.id());
            
            return {
                x: vertex.x,
                y: vertex.y
            };
        });

        if (this.options.fit) {
            //cy.fit();
        }
    }
}

class FarmToForkLayouter {
    constructor(private graph: Graph, private typeRanker: BusinessTypeRanker) {};

    layout(width: number, height: number, vertexDistance: number) {
        const vertexCount: number = this.graph.vertices.length;
        this.simplifyGraph();
        this.correctEdges();
        this.simplifyGraph();
        let startTime: Date = new Date();
        removeCycles(this.graph, this.typeRanker);

        // console.log('removeCycles: ' + getElapsedTime(startTime,new Date()).toString() + ' ms');
        this.simplifyGraph();
        startTime = new Date();
        assignLayers(this.graph, this.typeRanker);
        // console.log('assignLayers: ' + getElapsedTime(startTime,new Date()).toString() + ' ms');
        // removeEdgesWithinLayers(this.graph);
        startTime = new Date();
        sortAndPosition(this.graph, vertexDistance);
        // console.log('sortAndPositionVertices: ' + getElapsedTime(startTime,new Date()).toString() + ' ms');
        scaleToSize(this.graph, width, height, vertexDistance);
    }

    simplifyGraph() {
        for (const vertex of this.graph.vertices) { vertex.inEdges = []; }
        for (const vertex of this.graph.vertices) {
            const targets = _.uniq(vertex.outEdges.map(e => e.target.index)).filter(i => i !== vertex.index);
            const oldEdges: Edge[] = vertex.outEdges;
            vertex.outEdges = [];
            for (const iTarget of targets) {
                const newEdge: Edge = new Edge(vertex, this.graph.vertices[iTarget], false);
                newEdge.weight = 0;
                for (const edge of oldEdges) {
                    if (edge.target.index === iTarget) {
                        newEdge.weight += edge.weight;
                    }
                }
                vertex.outEdges.push(newEdge);
                newEdge.target.inEdges.push(newEdge);
            }
        }
    }

    correctEdges() {
        const edgesToInvert: Edge[] = [];
        for (const vertex of this.graph.vertices) {
            for (const edge of vertex.outEdges) {
                if (this.typeRanker.compareRanking(vertex, edge.target) > 0) { edgesToInvert.push(edge); }
            }
        }
        this.graph.invertEdges(edgesToInvert);
    }
}
