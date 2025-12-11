import { Cy } from "../graph/graph.model";
import { isArrayNotEmpty } from "../util/non-ui-utils";

export function HAlignLayout(options) {
    this.options = options;
}

function getMean(array: [number, ...number[]]): number {
    return array.reduce((pV, cV) => pV + cV, 0) / array.length;
}

class HAlignLayoutClass {
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

        for (const key of Object.keys(HAlignLayoutClass.DEFAULTS)) {
            if (!Object.prototype.hasOwnProperty.call(this.options, key)) {
                this.options[key] = HAlignLayoutClass.DEFAULTS[key];
            }
        }
    }

    run() {
        const cy = this.options.cy as Cy;
        const elementIds = new Set<string>();

        this.options.eles.each((e) => elementIds.add(e.id()));

        const yPositions = cy
            .nodes()
            .filter((n) => elementIds.has(n.id()))
            .map((n) => n.position().y);

        if (isArrayNotEmpty(yPositions)) {
            const newY = getMean(yPositions);
            cy.nodes().layoutPositions(this.layout, this.options, (node) =>
                elementIds.has(node.id())
                    ? {
                          x: node.position().x,
                          y: newY,
                      }
                    : node.position(),
            );
        }

        if (this.options.fit) {
            cy.fit();
        }
    }
}

HAlignLayout.prototype.run = function () {
    new HAlignLayoutClass(this).run();
};
