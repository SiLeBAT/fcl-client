type ImportSourceType = 'all-in-one' | 'fw' | 'bw';


interface TableColumn {

}

interface ImportTable<T extends {}> {
    columns: TableColumn[];
    rows: T;
}

interface ImportSource {
    type: ImportSourceType;
    name: string;
    stations: ImportTable<StationRow>;
    deliveries: ImportTable<DeliveryRow>;
    del2Dels: ImportTable<Del2DelRow>;
}

interface StationRow {

}

interface DeliveryRow {

}

interface Del2DelRow {
    from: string;
    to: string;
}

const IDENT_DEL_PROPS =
