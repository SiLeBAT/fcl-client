import {Port} from './../datatypes';

//interface Port {}

interface PortOutPattern {
    port: Port;
    targets: number[];
}


function aggregatePorts(graph: NestedLayeredGraph) {
    const portMapping: Map<Port, Port> = new Map();
    const outerInPorts: Port[] = [];
    
    const outPatternComparator = (a: PortOutPattern, b: PortOutPattern) => {
        if (a.targets.length < b.targets.length) { return -1; }
        if (a.targets.length > b.targets.length) { return 1; }
        for (let i = 0, n = a.targets.length; i < n; i++) {
            if (a.targets[i] < b.targets[i]) { return -1; }
            if (a.targets[i] > b.targets[i]) { return 1; }
        }
        return 0;
    };

    for (const outerLayer of graph.outerLayers) {
        const inPortLayer: Port[][][] = outerLayer;
        for (const countryPortGroup of inPortLayer) {
            for (const companyPortGroup of countryPortGroup) {
                const portOutPatterns: PortOutPattern[] = [];
                for (const port of companyPortGroup) {
                    const portOutPattern: PortOutPattern = { port: port, targets: port.outEdges.map(e => e.target.index)};
                    portOutPattern.targets.sort();
                    portOutPatterns.push(portOutPattern);
                }
                portOutPatterns.sort(outPatternComparator);
                const toRemove: boolean[] = _.fill(Array(portOutPatterns.length), false);
                for (let iP = 0, nP = portOutPatterns.length; iP < nP; iP++) {
                    for (let iP2 = iP + 1; iP2 < nP; iP2++) {
                        if (!toRemove[iP2] && outPatternComparator(portOutPatterns[iP], portOutPatterns[iP2]) === 0) {
                            toRemove[iP2] = true;
                            portMapping.set(portOutPatterns[iP2].port, portOutPatterns[iP].port);
                        }
                    }
                }
                portMapping.forEach((portToMerge: Port, portToMergeInto: Port) => {
                    for (const edge of portToMerge.inEdges) {
                        edge.target = portToMergeInto;
                        portToMergeInto.inEdges.push(edge);
                    }
                    for (const edge of portToMerge.outEdges) {
                        edge.source = portToMergeInto;
                        portToMergeInto.outEdges.push(edge);
                    }
                  });
                countryPortGroup.replace(companyPortGroup, portMapping.values());
            }
        }
    }
    
    // const targetSignatures: string[][] = [];

}

function getPortOuts(outerInPorts: Port[]) string[][]