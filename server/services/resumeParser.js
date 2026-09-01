const fs = require('fs/promises');
const path = require('path');

const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

const parseResume = async (filePath, mimeType) => {
    const absolutePath = path.resolve(filePath);

    if (mimeType === 'application/pdf') {
        const buffer = await fs.readFile(absolutePath);

        const parser = new PDFParse({
            data: buffer,
        });

        const result = await parser.getText();

        await parser.destroy();

        return result.text.trim();
    }

    if (
        mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        const result = await mammoth.extractRawText({
            path: absolutePath,
        });

        return result.value.trim();
    }

    throw new Error('Unsupported resume file type');
};

module.exports = {
    parseResume,
};