import { json } from '@sveltejs/kit';
import fsp from 'fs/promises';
import path from 'path';
import process from 'process';

const BASE_DIR = process.cwd();

export async function GET({ url }) {
    const filePath = url.searchParams.get('path');
    if (!filePath) {
        return json({ error: 'Не указан путь к файлу.' }, { status: 400 });
    }
    const absPath = path.resolve(BASE_DIR, filePath);

    try {
        const content = await fsp.readFile(absPath, 'utf-8');
        return json({ content, path: filePath });
    } catch (error) {
        console.error(error);
        return json({ error: `Не удалось прочитать файл: ${error.message}` }, { status: 500 });
    }
}

export async function POST({ request }) {
    const { path: filePath, content } = await request.json();
    const absPath = path.resolve(BASE_DIR, filePath);

    try {
        await fsp.writeFile(absPath, content, 'utf-8');
        return json({ success: true, message: 'Файл успешно сохранен.' });
    } catch (error) {
        console.error(error);
        return json({ error: `Не удалось сохранить файл: ${error.message}` }, { status: 500 });
    }
}
