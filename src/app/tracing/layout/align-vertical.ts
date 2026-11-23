import { Cy } from "../graph/graph.model";
import { isArrayNotEmpty } from "../util/non-ui-utils";

export function VAlignLayout(options) {
    this.options = options;
}

function getMean(array: [number, ...number[]]): number {
    return array.reduce((pV, cV) => pV + cV, 0) / array.length;
}

class VAlignLayoutClass {
    private static DEFAULTS = {
        fit: true,
    };

    private layout: any;
    private options: any;

    constructor(layout: any) {
        this.layout = layout;
        this.options = {};

        for (const key of Object.keys(layout.options)) {
            this.options[key] = layout.options[key];
        }

        for (const key of Object.keys(VAlignLayoutClass.DEFAULTS)) {
            if (!Object.prototype.hasOwnProperty.call(this.options, key)) {
                this.options[key] = VAlignLayoutClass.DEFAULTS[key];
            }
        }
    }

    run() {
        const cy = this.options.cy as Cy;
        const elementIds = new Set<string>();

        this.options.eles.each((e) => elementIds.add(e.id()));

        const xPositions = cy
            .nodes()
            .filter((n) => elementIds.has(n.id()))
            .map((n) => n.position().x);
        if (isArrayNotEmpty(xPositions)) {
            const newX = getMean(xPositions);
            cy.nodes().layoutPositions(this.layout, this.options, (node) =>
                elementIds.has(node.id())
                    ? {
                          x: newX,
                          y: node.position().y,
                      }
                    : node.position(),
            );
        }

        if (this.options.fit) {
            cy.fit();
        }
    }
}

VAlignLayout.prototype.run = function () {
    new VAlignLayoutClass(this).run();
};
