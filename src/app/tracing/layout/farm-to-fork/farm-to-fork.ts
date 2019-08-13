// implementation according to:
// according to http://publications.lib.chalmers.se/records/fulltext/161388.pdf
import * as _ from 'lodash';
import { Graph, Vertex, Edge } from './farm-to-fork.model';
import { removeCycles } from './cycle-remover';
import { assignLayers } from './layer-assigner';
import { BusinessTypeRanker } from './business-type-ranker';
import { scaleToSize } from './shared';
import { sortAndPosition } from './vertex-sorter-and-positioner';

export function FarmToForkLayout(options) {
    this.options = options;
}

FarmToForkLayout.prototype.run = function () {
    // tslint:disable-next-line
    new FarmToForkLayoutClass(this).run();
};

export class FarmToForkLayouter {
    constructor(private graph: Graph, private typeRanker: BusinessTypeRanker) {}

    layout(vertexDistance: number) {
        const vertexCount: number = this.graph.vertices.length;
        this.simplifyGraph();
        this.correctEdges();
        this.simplifyGraph();

        removeCycles(this.graph, this.typeRanker);
        this.simplifyGraph();
        assignLayers(this.graph, this.typeRanker);
        sortAndPosition(this.graph, vertexDistance);
    }

    simplifyGraph() {
        for (const vertex of this.graph.vertices) {
            vertex.inEdges = [];
        }
        for (const vertex of this.graph.vertices) {
            const targets = _.uniq(vertex.outEdges.map(e => e.target.index)).filter(
                i => i !== vertex.index
            );
            const oldEdges: Edge[] = vertex.outEdges;
            vertex.outEdges = [];
            for (const iTarget of targets) {
                const newEdge: Edge = new Edge(
                    vertex,
                    this.graph.vertices[iTarget],
                    false
                );
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
                if (this.typeRanker.compareRanking(vertex, edge.target) > 0) {
                    edgesToInvert.push(edge);
                }
            }
        }
        this.graph.invertEdges(edgesToInvert);
    }
}

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
            const v: Vertex = new Vertex();
            v.typeCode = typeRanker.getBusinessTypeCode(node['data']['typeOfBusiness']);
            v.size = node.height();
            v.name = node.data('name');
            vertices.set(node.id(), v);
            graph.insertVertex(v);
        });

        const vertexDistance: number = Math.min(...graph.vertices.map(v => v.size)) / 2;
        cy.edges().forEach(edge => graph.insertEdge(
            vertices.get(edge.source().id()),
            vertices.get(edge.target().id())
        ));

        const layoutManager: FarmToForkLayouter = new FarmToForkLayouter(graph, typeRanker);

        layoutManager.layout(vertexDistance);
        scaleToSize(graph, width, height, vertexDistance);

        cy.nodes().layoutPositions(this.layout, this.options, node => {
            const vertex = vertices.get(node.id());

            return {
                x: vertex.x,
                y: vertex.y
            };
        });
    }
}
