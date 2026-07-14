const { ipcMain, dialog } = require('electron')
const path = require('path')
const os = require('os')
const fs = require('fs')
const db = require('../database/db')
const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak,
    AlignmentType, Header, Footer, PageNumber, LineRuleType
} = require('docx')

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

async function buildDocx(title, chapters, authorName = '') {
    const FONT = 'Times New Roman'
    const FONT_SIZE = 24
    const MARGIN = 1440

    const children = []

    // Page de titre
    children.push(
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 2000, after: 400 },
            children: [new TextRun({ text: authorName, font: FONT, size: FONT_SIZE })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
            children: [new TextRun({ text: title, font: FONT, size: 36, bold: true })]
        }),
        new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 400 },
            children: [new TextRun({
                text: `${chapters.reduce((acc, ch) => {
                    const text = htmlToText(ch.content || '')
                    return acc + (text.trim() === '' ? 0 : text.trim().split(/\s+/).length)
                }, 0).toLocaleString()} mots`,
                font: FONT,
                size: FONT_SIZE,
                italics: true
            })]
        }),
        new Paragraph({ children: [new PageBreak()] })
    )

    for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i]

        if (i > 0) {
            children.push(new Paragraph({ children: [new PageBreak()] }))
        }

        // Titre du chapitre centré
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 1440, after: 1440 },
            children: [new TextRun({ text: chapter.title, font: FONT, size: 28, bold: true })]
        }))

        // Contenu
        const text = htmlToText(chapter.content || '')
        const lines = text.split('\n').filter(l => l.trim() !== '')

        for (let j = 0; j < lines.length; j++) {
            children.push(new Paragraph({
                indent: { firstLine: 0 },
                spacing: { line: 480, lineRule: LineRuleType.AUTO, before: 0, after: 0 },
                children: [new TextRun({ text: lines[j], font: FONT, size: FONT_SIZE })]
            }))
        }
    }

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    size: { width: 11906, height: 16838 },
                    margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN }
                }
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 18 })]
                        })
                    ]
                })
            },
            children
        }]
    })

    return await Packer.toBuffer(doc)
}

async function buildPdfBuffer(title, chapters, showTitle, authorName = '') {
    const wordCount = chapters.reduce((acc, ch) => {
        const text = htmlToText(ch.content || '')
        return acc + (text.trim() === '' ? 0 : text.trim().split(/\s+/).length)
    }, 0)

    // 2.5cm en pouces = 0.984
    const MARGIN_INCH = 0.984

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                /* PAS de @page avec margin ici — c'est printToPDF qui gère les marges */
                /* Le @page sert uniquement à forcer la taille A4 */
                @page {
                    size: A4;
                }

                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Times New Roman', serif;
                    font-size: 12pt;
                    line-height: 2;
                    color: #000;
                    margin: 0;
                    padding: 0;
                    /* Laisser de la place en bas pour le footer fixe */
                    padding-bottom: 1.5cm;
                }

                /* ── Page de titre ── */
                .title-page {
                    text-align: center;
                    padding-top: 8cm;
                    page-break-after: always;
                    /* Éviter que le footer chevauche le contenu */
                    min-height: calc(100vh - 3cm);
                }
                .title-page h1 {
                    font-size: 24pt;
                    margin-bottom: 1em;
                    font-weight: bold;
                }
                .title-page .author {
                    font-size: 14pt;
                    margin-bottom: 0.5em;
                }
                .title-page .wordcount {
                    font-size: 11pt;
                    font-style: italic;
                    color: #555;
                    margin-top: 2em;
                }

                /* ── Titres de chapitres ── */
                h2 {
                    font-size: 16pt;
                    text-align: center;
                    margin-top: 4cm;
                    margin-bottom: 2em;
                    page-break-before: always;
                    font-weight: bold;
                }
                h2:first-of-type {
                    page-break-before: avoid;
                }

                /* ── Paragraphes ── */
                p {
                    margin: 0;
                    padding: 0;
                    text-indent: 0;
                    line-height: 2;
                    /* word-wrap force le retour à la ligne même sur les mots très longs */
                    word-wrap: break-word;
                    overflow-wrap: break-word;
                    white-space: pre-wrap;
                    /* Empêche le texte de déborder hors du conteneur */
                    max-width: 100%;
                }

                /* ── Footer avec numéro de page ── */
                /* 
                    Chromium/Electron ne supporte pas @bottom-center dans @page.
                    On utilise un footer HTML fixe à la place.
                    Le numéro de page réel par page n'est pas possible en CSS pur
                    avec printToPDF — on affiche un footer décoratif.
                    Pour les numéros de page dynamiques, voir le script JS ci-dessous.
                */
                .pdf-footer {
                    position: fixed;
                    bottom: 0.4cm;
                    left: 0;
                    right: 0;
                    text-align: center;
                    font-family: 'Times New Roman', serif;
                    font-size: 10pt;
                    color: #666;
                }
            </style>
        </head>
        <body>

            <!-- Footer fixe affiché sur chaque page -->
            <div class="pdf-footer" id="page-footer"></div>

            ${showTitle ? `
                <div class="title-page">
                    ${authorName ? `<p class="author">${authorName}</p>` : ''}
                    <h1>${title}</h1>
                </div>
            ` : ''}

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

    const pdfBuffer = await win.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
        // CORRECTION PRINCIPALE :
        // - marginType: 'custom' est obligatoire pour que les valeurs soient prises en compte
        // - les valeurs sont en POUCES (pas cm, pas px)
        // - 0.984 pouce ≈ 2.5cm
        margins: {
            marginType: 'custom',
            top: MARGIN_INCH,
            bottom: MARGIN_INCH,
            left: MARGIN_INCH,
            right: MARGIN_INCH
        }
    })

    win.close()
    fs.unlinkSync(tmpPath)

    return pdfBuffer
}

ipcMain.handle('export:chapters', async (event, { bookId, tomeId, chapterIds, format, mode }) => {
    try {
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
        const authorName = ''

        if (mode === 'zip') {
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Exporter en ZIP',
                defaultPath: path.join(os.homedir(), `${bookTitle}.zip`),
                filters: [{ name: 'ZIP', extensions: ['zip'] }]
            })
            if (canceled || !filePath) return { success: false, message: 'Annulé' }

            const tmpDir = path.join(os.tmpdir(), `export_${Date.now()}`)
            fs.mkdirSync(tmpDir)

            for (const chapter of chapters) {
                const safeName = chapter.title.replace(/[^a-zA-Z0-9\-_ ]/g, '').trim() || `chapitre_${chapter.id}`
                if (format === 'docx') {
                    const buffer = await buildDocx(chapter.title, [chapter], authorName)
                    fs.writeFileSync(path.join(tmpDir, `${safeName}.docx`), buffer)
                } else {
                    const buffer = await buildPdfBuffer(chapter.title, [chapter], false, authorName)
                    fs.writeFileSync(path.join(tmpDir, `${safeName}.pdf`), buffer)
                }
            }

            const archiver = require('archiver')
            const output = fs.createWriteStream(filePath)
            const archive = archiver('zip')
            await new Promise((resolve, reject) => {
                output.on('close', resolve)
                archive.on('error', reject)
                archive.pipe(output)
                archive.directory(tmpDir, false)
                archive.finalize()
            })
            fs.rmSync(tmpDir, { recursive: true })

        } else {
            const { canceled, filePath } = await dialog.showSaveDialog({
                title: 'Exporter',
                defaultPath: path.join(os.homedir(), `${bookTitle}.${format}`),
                filters: format === 'docx'
                    ? [{ name: 'Word', extensions: ['docx'] }]
                    : [{ name: 'PDF', extensions: ['pdf'] }]
            })
            if (canceled || !filePath) return { success: false, message: 'Annulé' }

            if (format === 'docx') {
                const buffer = await buildDocx(bookTitle, chapters, authorName)
                fs.writeFileSync(filePath, buffer)
            } else {
                const buffer = await buildPdfBuffer(bookTitle, chapters, chapters.length > 1, authorName)
                fs.writeFileSync(filePath, buffer)
            }
        }

        return { success: true }

    } catch (err) {
        return { success: false, message: err.message }
    }
})