import path from "path";
import { promises as fs } from "fs";
import { create_folder } from "./create_folder";

export class Cache {
    cache_path = path.resolve("./cache");
    constructor() {
        this.init().then(() => {});
    }
    async init(): Promise<void> {
        await create_folder(this.cache_path);
    }
    async writeFile(filename: string, data: string): Promise<void> {
        await fs.writeFile(this.get_path(filename), data);
    }
    async deleteFile(filename: string): Promise<void> {
        await fs.unlink(this.get_path(filename));
    }
    async readFile(filename: string): Promise<string> {
        const data = await fs.readFile(this.get_path(filename), { encoding: "utf-8" });
        return data;
    }
    async clean(): Promise<void> {
        await fs.rm(this.cache_path, { force: true, recursive: true });
        await this.init();
    }
    private get_path(filename: string): string {
        return path.join(this.cache_path, filename);
    }
}