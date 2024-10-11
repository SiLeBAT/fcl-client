export class Register {
    private map = new Map<string, number>();

    has(id: string): boolean {
        return this.map.has(id);
    }

    private getCount(id: string): number {
        return this.map.get(id) ?? 0;
    }

    add(id: string): void {
        this.map.set(id, this.getCount(id) + 1);
    }

    isRegisteredOnce(id: string): boolean {
        return this.getCount(id) === 1;
    }
}
