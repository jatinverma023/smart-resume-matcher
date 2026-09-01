const SKILL_DICTIONARY = {
    javascript: {
        category: 'programming',
        aliases: ['javascript'],
    },

    python: {
        category: 'programming',
        aliases: ['python'],
    },

    java: {
        category: 'programming',
        aliases: ['java'],
    },

    c: {
        category: 'programming',
        aliases: ['c programming', 'c language'],
    },

    typescript: {
        category: 'programming',
        aliases: ['typescript', 'ts'],
    },

    react: {
        category: 'frontend',
        aliases: ['react', 'react.js', 'reactjs'],
    },

    nextjs: {
        category: 'frontend',
        aliases: ['next.js', 'nextjs', 'next js'],
    },

    tailwindcss: {
        category: 'frontend',
        aliases: ['tailwind css', 'tailwindcss'],
    },

    html: {
        category: 'frontend',
        aliases: ['html', 'html5'],
    },

    css: {
        category: 'frontend',
        aliases: ['css', 'css3'],
    },

    nodejs: {
        category: 'backend',
        aliases: ['node.js', 'nodejs', 'node js'],
    },

    express: {
        category: 'backend',
        aliases: ['express.js', 'expressjs', 'express'],
    },

    fastapi: {
        category: 'backend',
        aliases: ['fastapi', 'fast api'],
    },

    mongodb: {
        category: 'database',
        aliases: ['mongodb', 'mongo db'],
    },

    mysql: {
        category: 'database',
        aliases: ['mysql'],
    },

    git: {
        category: 'devops',
        aliases: ['git'],
    },

    github: {
        category: 'devops',
        aliases: ['github'],
    },

    jwt: {
        category: 'security',
        aliases: ['jwt', 'jwt authentication'],
    },

    rbac: {
        category: 'security',
        aliases: ['rbac', 'role based access control'],
    },

    restapi: {
        category: 'backend',
        aliases: [
            'rest api',
            'rest apis',
            'restful api',
            'restful apis',
        ],
    },

    langchain: {
        category: 'ai',
        aliases: ['langchain'],
    },

    rag: {
        category: 'ai',
        aliases: [
            'rag',
            'retrieval augmented generation',
        ],
    },

    gemini: {
        category: 'ai',
        aliases: [
            'gemini api',
            'google gemini',
            'gemini',
        ],
    },

    faiss: {
        category: 'ai',
        aliases: [
            'faiss',
            'faiss vector database',
        ],
    },

    ollama: {
        category: 'ai',
        aliases: ['ollama'],
    },

    cloudinary: {
        category: 'tools',
        aliases: ['cloudinary'],
    },

    vercel: {
        category: 'devops',
        aliases: ['vercel'],
    },

    render: {
        category: 'devops',
        aliases: ['render'],
    },

    postman: {
        category: 'tools',
        aliases: ['postman'],
    },
};
const normalizeText = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s.+#-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const extractSkills = (text) => {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const normalizedText = normalizeText(text);

    const foundSkills = [];

    for (const [skill, definition] of Object.entries(
        SKILL_DICTIONARY
    )) {
        const found = definition.aliases.some((alias) => {
            const normalizedAlias = normalizeText(alias);

            const escapedAlias = normalizedAlias.replace(
                /[.*+?^${}()|[\]\\]/g,
                '\\$&'
            );

            const pattern = new RegExp(
                `(^|[^a-z0-9])${escapedAlias}(?=$|[^a-z0-9])`,
                'i'
            );

            return pattern.test(normalizedText);
        });

        if (found) {
            foundSkills.push({
                name: skill,
                category: definition.category,
            });
        }
    }

    return foundSkills;
};

module.exports = {
    extractSkills,
};