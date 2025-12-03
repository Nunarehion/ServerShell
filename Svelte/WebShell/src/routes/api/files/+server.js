import { json } from '@sveltejs/kit';
import fsp from 'fs/promises';
import fs from 'fs';
import { pipeline } from 'stream'; 
import path from 'path';
import process from 'process';


const BASE_DIR = process.cwd();

export async function GET({ url }) {
    const targetPath = url.searchParams.get('path') || '/';
    const downloadFile = url.searchParams.get('download');

    if (downloadFile) {
        const fileAbsPath = path.resolve(BASE_DIR, targetPath, downloadFile);

        try {
            const stats = await fsp.stat(fileAbsPath);
            if (!stats.isFile()) {
                return json({ error: 'Это не файл или файл не существует.' }, { status: 400 });
            }

            const headers = {
                'Content-Disposition': `attachment; filename="${path.basename(fileAbsPath)}"`,
                'Content-Type': 'application/octet-stream',
                'Content-Length': stats.size,
            };

            return new Response(fs.createReadStream(fileAbsPath), { headers });

        } catch (error) {
            console.error(error);
            return json({ error: `Ошибка при скачивании: ${error.message}` }, { status: 500 });
        }
    }

    try {
        const absPath = path.resolve(BASE_DIR, targetPath);
        const entries = await fsp.readdir(absPath, { withFileTypes: true });

        const files = entries.map(entry => {
            const entryPathRel = path.join(targetPath, entry.name);
            return {
                name: entry.name,
                type: entry.isDirectory() ? 'directory' : 'file',
                path: entryPathRel.split(path.sep).join('/')
            };
        });

        if (targetPath !== '/') {
            files.unshift({
                name: '..',
                type: 'directory',
                path: path.dirname(targetPath).split(path.sep).join('/')
            });
        }

        return json({ currentPath: targetPath, files });

    } catch (error) {
        console.error(error);
        return json({ error: `Ошибка чтения директории: ${error.message}` }, { status: 500 });
    }
}


export async function POST({ request }) {
    const { action, path: targetPath, name } = await request.json();

    if (action === 'mkdir') {
        try {
            const absPath = path.resolve(BASE_DIR, targetPath, name);
            await fsp.mkdir(absPath);
            return json({ success: true, message: `Папка ${name} создана.` });
        } catch (error) {
            return json({ error: error.message }, { status: 500 });
        }
    }

    return json({ error: 'Неизвестное действие.' }, { status: 400 });
}


export async function PUT({ request }) {
    try {
        const formData = await request.formData();
        const targetPath = formData.get('targetPath') || '/';
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            throw new Error('Файл не был загружен.');
        }

        const uploadPath = path.resolve(BASE_DIR, targetPath, file.name);
        const fileStream = file.stream();
        const writeStream = fs.createWriteStream(uploadPath);

        await new Promise((resolve, reject) => {
            pipeline(fileStream, writeStream, (err) => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
        });

        return json({ success: true, message: `Файл ${file.name} успешно загружен.` });

    } catch (error) {
        console.error(error);
        return json({ error: `Ошибка загрузки: ${error.message}` }, { status: 500 });
    }
}


export async function DELETE({ request }) {
    const { path: targetPath, name, type } = await request.json();
    const absPath = path.resolve(BASE_DIR, targetPath, name);

    try {
        if (type === 'directory') {
            await fsp.rm(absPath, { recursive: true, force: true });
            return json({ success: true, message: `Папка ${name} удалена.` });
        } else {
            await fsp.unlink(absPath);
            return json({ success: true, message: `Файл ${name} удален.` });
        }
    } catch (error) {
        console.error(error);
        return json({ error: `Ошибка удаления: ${error.message}` }, { status: 500 });
    }
}


export async function PATCH({ request }) {
    const { path: targetPath, oldName, newName } = await request.json();

    const oldAbsPath = path.resolve(BASE_DIR, targetPath, oldName);
    const newAbsPath = path.resolve(BASE_DIR, targetPath, newName);

    try {
        await fsp.stat(newAbsPath);
        return json({ error: `Имя ${newName} уже занято.` }, { status: 400 });
    } catch (e) {
    }

    try {
        await fsp.rename(oldAbsPath, newAbsPath);
        return json({ success: true, message: `Переименовано в ${newName}.` });
    } catch (error) {
        console.error(error);
        return json({ error: `Ошибка переименования: ${error.message}` }, { status: 500 });
    }
}
