const normalizeSkill = (skill) => {
    if (!skill) {
        return '';
    }

    return skill
        .toLowerCase()
        .trim()
        .replace(/[.\s_-]+/g, '');
};

const calculateMatch = (resume, job) => {
    const candidateSkills = new Set(
        (resume.skills || []).map((skill) =>
            normalizeSkill(skill.name)
        )
    );

    const requiredSkills = (job.requiredSkills || [])
        .map(normalizeSkill)
        .filter(Boolean);

    const preferredSkills = (job.preferredSkills || [])
        .map(normalizeSkill)
        .filter(Boolean);

    const matchedRequired = requiredSkills.filter(
        (skill) => candidateSkills.has(skill)
    );

    const matchedPreferred = preferredSkills.filter(
        (skill) => candidateSkills.has(skill)
    );

    const requiredCoverage =
        requiredSkills.length > 0
            ? matchedRequired.length / requiredSkills.length
            : 1;

    const preferredCoverage =
        preferredSkills.length > 0
            ? matchedPreferred.length / preferredSkills.length
            : 1;

    const requiredScore = requiredCoverage * 70;

    const preferredScore = preferredCoverage * 30;

    const finalScore =
        requiredScore + preferredScore;

    const missingRequired = requiredSkills.filter(
        (skill) => !candidateSkills.has(skill)
    );

    const missingPreferred = preferredSkills.filter(
        (skill) => !candidateSkills.has(skill)
    );

    return {
        score: Math.round(finalScore * 100) / 100,

        required: {
            total: requiredSkills.length,
            matched: matchedRequired.length,
            coverage:
                Math.round(requiredCoverage * 10000) / 100,
            matchedSkills: matchedRequired,
            missingSkills: missingRequired,
        },

        preferred: {
            total: preferredSkills.length,
            matched: matchedPreferred.length,
            coverage:
                Math.round(preferredCoverage * 10000) / 100,
            matchedSkills: matchedPreferred,
            missingSkills: missingPreferred,
        },
    };
};

module.exports = {
    calculateMatch,
};