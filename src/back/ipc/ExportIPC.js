const { ipcMain, dialog } = require('electron')
const { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak } = require('docx')
const fs = require('fs')
const path = require('path')
const os = require('os')
const JSZip = require('jszip')
const db = require('../database/db')

function htmlToText(html) {
    if (!html) return ''
    return html
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(code))
        .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
        .trim()
}

async function buildDocx(title, chapters) {
    const children = []

    // Titre seulement si plusieurs chapitres
    if (chapters.length > 1) {
        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_1,
            children: [new TextRun({ text: title, bold: true, size: 48 })]
        }))
    }

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i]

        if (i > 0 || chapters.length > 1) {
            children.push(new Paragraph({ children: [new PageBreak()] }))
        }

        children.push(new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: chapter.title, bold: true, size: 32 })]
        }))

        const text = htmlToText(chapter.content || '')
        const lines = text.split('\n')
        for (const line of lines) {
            children.push(new Paragraph({
                children: [new TextRun({ text: line, size: 24 })]
            }))
        }
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { width: 11906, height: 16838 },
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
                }
            },
            children
        }]
    })

    return await Packer.toBuffer(doc)
}

async function buildPdfBuffer(title, chapters, showTitle) {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Georgia, serif; font-size: 12pt; line-height: 1.8; margin: 2cm; color: #333; }
                h1 { font-size: 24pt; text-align: center; margin-bottom: 2em; color: #222; }
                h2 { font-size: 16pt; margin-top: 2em; page-break-before: always; color: #444; }
                h2:first-of-type { page-break-before: avoid; }
                p { margin: 0.5em 0; text-indent: 1.5em; }
            </style>
        </head>
        <body>
            ${showTitle ? `<h1>${title}</h1>` : ''}
            ${chapters.map(ch => `
                <h2>${ch.title}</h2>
                ${ch.content || '<p>Aucun contenu</p>'}
            `).join('')}
        </body>
        </html>
    `

    const tmpPath = path.join(os.tmpdir(), `export_${Date.now()}.html`)
    fs.writeFileSync(tmpPath, htmlContent, 'utf8')

    const { BrowserWindow } = require('electron')
    const win = new BrowserWindow({ show: false })
    await win.loadFile(tmpPath)
    const pdfBuffer = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
    win.close()
    fs.unlinkSync(tmpPath)

    return pdfBuffer
}

ipcMain.handle('export:chapters', async (event, { bookId, tomeId, chapterIds, format, mode }) => {
    try {
        // Récupère les chapitres
        let query = `SELECT * FROM chapter WHERE book_id = ?`
        let params = [bookId]

        if (tomeId) { query += ` AND tome_id = ?`; params.push(tomeId) }
        if (chapterIds && chapterIds.length > 0) {
            query += ` AND id IN (${chapterIds.map(() => '?').join(',')})`
            params.push(...chapterIds)
        }
        query += ` ORDER BY position ASC`
        const [chapters] = await db.query(query, params)

        const [books] = await db.query(`SELECT title FROM book WHERE id = ?`, [bookId])
        const bookTitle = books[0]?.title || 'Mon livre'

        if (mode === 'zip') {
            // ZIP avec un fichier par chapitre
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Exporter en ZIP',
                defaultPath: path.join(os.homedir(), `${bookTitle}.zip`),
                filters: [{ name: 'ZIP', extensions: ['zip'] }]
            })
            if (canceled || !filePath) return { success: false, message: 'Annulé' }

            const zip = new JSZip()

            for (const chapter of chapters) {
                const safeName = chapter.title.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim() || `chapitre_${chapter.id}`

                if (format === 'docx') {
                    const buffer = await buildDocx(chapter.title, [chapter])
                    zip.file(`${safeName}.docx`, buffer)
                } else {
                    const buffer = await buildPdfBuffer(chapter.title, [chapter], false)
                    zip.file(`${safeName}.pdf`, buffer)
                }
            }

            const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })
            fs.writeFileSync(filePath, zipBuffer)

        } else {
            // Fichier unique
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Exporter',
                defaultPath: path.join(os.homedir(), `${bookTitle}.${format}`),
                filters: format === 'docx'
                    ? [{ name: 'Word', extensions: ['docx'] }]
                    : [{ name: 'PDF', extensions: ['pdf'] }]
            })
            if (canceled || !filePath) return { success: false, message: 'Annulé' }

            if (format === 'docx') {
                const buffer = await buildDocx(bookTitle, chapters)
                fs.writeFileSync(filePath, buffer)
            } else {
                const buffer = await buildPdfBuffer(bookTitle, chapters, chapters.length > 1)
                fs.writeFileSync(filePath, buffer)
            }
        }

        return { success: true }

    } catch (err) {
        return { success: false, message: err.message }
    }
})