// implementation according to:
// according to http://publications.lib.chalmers.se/records/fulltext/161388.pdf
import * as _ from 'lodash';
import { Graph, Vertex, Edge } from './data-structures';
import { removeCycles } from './cycle-remover';
import { assignLayers } from './layer-assigner';
import { BusinessTypeRanker } from './business-type-ranker';
import { scaleToSize } from './shared';
import { sortAndPosition } from './vertex-sorter-and-positioner';
import { Size } from '@app/tracing/data.model';

export function FarmToForkLayout(options) {
    this.options = options;
}

FarmToForkLayout.prototype.run = function () {
    // tslint:disable-next-line
    new FarmToForkLayoutClass(this).run();
};

export class FarmToForkLayouter {
    constructor(private graph: Graph, private typeRanker: BusinessTypeRanker, availableSpace: Size) {}

    layout(vertexDistance: number, availableSpace: Size, timeLimit?: number) {
        if (timeLimit === undefined) {
            timeLimit = Number.POSITIVE_INFINITY;
        }
        const startTime = new Date().getTime();
        const vertexCount: number = this.graph.vertices.length;
        this.simplifyGraph();
        this.correctEdges();
        this.simplifyGraph();

        removeCycles(this.graph, this.typeRanker);
        this.simplifyGraph();
        assignLayers(this.graph, this.typeRanker);
        sortAndPosition(this.graph, vertexDistance, timeLimit - (new Date().getTime() - startTime), availableSpace);
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
        const timelimit: number = this.options.timelimit || Number.POSITIVE_INFINITY;
        const width: number = cy.width();
        const height: number = cy.height();
        const graph = new Graph();
        const vertices: Map<string, Vertex> = new Map();
        const typeRanker: BusinessTypeRanker = new BusinessTypeRanker([], [], []);

        let vertexDistance = Number.POSITIVE_INFINITY;
        let maxRightPadding = 0;
        let maxLeftPadding = 0;

        for (const node of cy.nodes()) {
            const v: Vertex = new Vertex();
            v.typeCode = typeRanker.getBusinessTypeCode(node['data']['typeOfBusiness']);
            const nodeHeight = node.layoutDimensions().h;
            const renderedBoundingBox = node.renderedBoundingBox();
            const renderedPosition = node.renderedPosition();
            maxLeftPadding = Math.max(maxLeftPadding, renderedPosition.x - renderedBoundingBox.x1);
            maxRightPadding = Math.max(maxRightPadding, renderedBoundingBox.x2 - renderedPosition.x);
            v.bottomPadding = renderedBoundingBox.y2 - renderedPosition.y;
            v.topPadding = renderedPosition.y - renderedBoundingBox.y1;
            v.outerSize = v.bottomPadding + v.topPadding;
            v.innerSize = 0;
            v.name = node.data('label');
            vertexDistance = Math.min(vertexDistance, nodeHeight);
            vertices.set(node.id(), v);
            graph.insertVertex(v);
        }

        cy.edges().forEach(edge => graph.insertEdge(
            vertices.get(edge.source().id()),
            vertices.get(edge.target().id())
        ));

        const availableSpace = {
            width: width,
            height: height
        };
        const layoutManager: FarmToForkLayouter = new FarmToForkLayouter(graph, typeRanker, availableSpace);

        layoutManager.layout(vertexDistance, availableSpace, timelimit);
        scaleToSize(graph, width - maxLeftPadding - maxRightPadding, height, vertexDistance);

        cy.nodes().layoutPositions(this.layout, this.options, node => {
            const vertex = vertices.get(node.id());

            return {
                x: vertex.x,
                y: vertex.y
            };
        });
    }
}
