import * as _ from 'lodash';
import {Graph, Vertex, Edge} from './data_structures';
import {BusinessTypeRanker} from './business_type_ranker';

export function removeCycles(graph: Graph, typeRanker: BusinessTypeRanker) {
    const cycleRemover: CycleRemover = new CycleRemover();
    cycleRemover.removeCycles(graph, typeRanker);
}

class CycleRemover {

    private isMarked: boolean[];
    private isStacked: boolean[];

    constructor() {}

    init(graph: Graph) {
        this.isMarked = _.fill(Array(graph.vertices.length), false);
        this.isStacked = _.fill(Array(graph.vertices.length), false);
    }

    removeCycles(graph: Graph, typeRanker: BusinessTypeRanker) {
        this.init(graph);
        for (const vertex of graph.vertices) { this.dfsRemove(vertex); }
    }

    private dfsRemove(vertex: Vertex) {
        if (this.isMarked[vertex.index]) { return; }

        this.isMarked[vertex.index] = true;
        this.isStacked[vertex.index] = true;

        const reversedOutEdges: Set<Edge> = new Set();

        for (let iE = 0; iE < vertex.outEdges.length; iE++) {
            const outEdge: Edge = vertex.outEdges[iE];
            if (this.isStacked[outEdge.target.index]) {
                // reverse edge
                reversedOutEdges.add(outEdge);
            } else if (!this.isMarked[outEdge.target.index]) {
                this.dfsRemove(outEdge.target);
            }
        }

        if (reversedOutEdges.size > 0) {
            vertex.outEdges = vertex.outEdges.filter(e => !reversedOutEdges.has(e));

            reversedOutEdges.forEach(edge => {
                edge.target.inEdges = edge.target.inEdges.filter(e => !reversedOutEdges.has(e));
            });

            reversedOutEdges.forEach(oldEdge => {
                const newEdge: Edge = new Edge(oldEdge.target, oldEdge.source, false);
                newEdge.source.outEdges.push(newEdge);
                newEdge.target.inEdges.push(newEdge);
            });
        }

        this.isStacked[vertex.index] = false;
    }
}