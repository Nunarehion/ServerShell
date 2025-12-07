// src/routes/api/bookmarks/+server.js

import { json } from '@sveltejs/kit';
import fsp from 'fs/promises';
import path from 'path';
import process from 'process';

const BASE_DIR = process.cwd();
const BOOKMARKS_FILE = path.join(BASE_DIR, 'bookmarks.json');

export async function GET() {
    try {
        const data = await fsp.readFile(BOOKMARKS_FILE, 'utf-8');
        return json(JSON.parse(data));
    } catch (error) {
        if (error.code === 'ENOENT') {
            return json([]);
        }
        return json({ error: 'Не удалось загрузить закладки.' }, { status: 500 });
    }
}

export async function POST({ request }) {
    const { url, icon } = await request.json(); 

    if (!url) {
        return json({ error: 'URL не указан.' }, { status: 400 });
    }

    try {
        const data = await fsp.readFile(BOOKMARKS_FILE, 'utf-8');
        const bookmarks = JSON.parse(data);

        // Проверяем, нет ли уже такой закладки
        if (bookmarks.some(bookmark => bookmark.url === url)) {
            return json({ error: 'Закладка уже существует.' }, { status: 400 });
        }

        bookmarks.push({ url, icon: icon || '/default-icon.svg' });

        await fsp.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2), 'utf-8');

        return json({ success: true, message: 'Закладка сохранена.' });

    } catch (error) {
        if (error.code === 'ENOENT') {
            await fsp.writeFile(BOOKMARKS_FILE, JSON.stringify([{ url, icon: icon || '/default-icon.svg' }], null, 2), 'utf-8');
            return json({ success: true, message: 'Закладка сохранена в новом файле.' });
        }
        console.error(error);
        return json({ error: 'Не удалось сохранить закладку.' }, { status: 500 });
    }
}

export async function DELETE({ request }) {
    try {
        const { url } = await request.json();
        
        if (!url) {
            return json({ error: 'URL не указан.' }, { status: 400 });
        }

        const data = await fsp.readFile(BOOKMARKS_FILE, 'utf-8');
        let bookmarks = JSON.parse(data);

        const initialLength = bookmarks.length;
        bookmarks = bookmarks.filter(bookmark => bookmark.url !== url);
        
        if (bookmarks.length === initialLength) {
            return json({ error: 'Закладка не найдена.' }, { status: 404 });
        }

        await fsp.writeFile(BOOKMARKS_FILE, JSON.stringify(bookmarks, null, 2), 'utf-8');

        return json({ success: true, message: 'Закладка удалена.' });

    } catch (error) {
        if (error.code === 'ENOENT') {
            return json({ error: 'Файл закладок не найден.' }, { status: 404 });
        }
        console.error(error);
        return json({ error: 'Не удалось удалить закладку.' }, { status: 500 });
    }
}