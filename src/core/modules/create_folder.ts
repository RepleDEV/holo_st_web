import { promises as fs, existsSync } from "fs";
import path from "path";

export async function create_folder(folder_path: string): Promise<boolean> {
    const dirPath = path.resolve(__dirname, folder_path);
    const folderExists = existsSync(dirPath);

    if (!folderExists) {
        await fs.mkdir(dirPath);
    }

    return folderExists;
}