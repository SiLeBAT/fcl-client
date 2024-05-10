export interface ExampleData {
    name: string;
    path: string;
    children?: ExampleData[];
}

export type ModelFileType = 'json-fcl' | 'xlsx-all-in-one';
