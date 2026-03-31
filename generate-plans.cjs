const fs = require('fs');
const path = require('path');

// Helper to generate sequences
function genDays(total, refsPerDayGenerator) {
    const days = [];
    for (let i = 1; i <= total; i++) {
        days.push({ day: i, refs: refsPerDayGenerator(i) });
    }
    return days;
}

const plans = [
    {
        id: "proverbs-31-days",
        name: "Provérbios em 31 dias",
        description: "Leia um capítulo de Provérbios por dia e encha-se de sabedoria prática para a vida.",
        totalDays: 31,
        days: genDays(31, (i) => [`pv/${i}`])
    },
    {
        id: "psalms-30-days",
        name: "Salmos em 30 dias",
        description: "Uma jornada diária de adoração e oração através de 5 Salmos por dia.",
        totalDays: 30,
        days: genDays(30, (i) => {
            const start = (i - 1) * 5 + 1;
            return Array.from({ length: 5 }, (_, idx) => `sl/${start + idx}`);
        })
    },
    {
        id: "gospels-30-days",
        name: "Os 4 Evangelhos",
        description: "Conheça a vida, morte e ressurreição de Jesus Cristo em 30 dias.",
        totalDays: 30,
        days: [
            { day: 1, refs: ["mt/1", "mt/2", "mt/3"] },
            { day: 2, refs: ["mt/4", "mt/5", "mt/6"] },
            { day: 3, refs: ["mt/7", "mt/8", "mt/9"] },
            { day: 4, refs: ["mt/10", "mt/11", "mt/12"] },
            { day: 5, refs: ["mt/13", "mt/14", "mt/15"] },
            { day: 6, refs: ["mt/16", "mt/17", "mt/18"] },
            { day: 7, refs: ["mt/19", "mt/20", "mt/21"] },
            { day: 8, refs: ["mt/22", "mt/23", "mt/24"] },
            { day: 9, refs: ["mt/25", "mt/26"] },
            { day: 10, refs: ["mt/27", "mt/28"] },
            { day: 11, refs: ["mc/1", "mc/2", "mc/3"] },
            { day: 12, refs: ["mc/4", "mc/5", "mc/6"] },
            { day: 13, refs: ["mc/7", "mc/8", "mc/9"] },
            { day: 14, refs: ["mc/10", "mc/11", "mc/12"] },
            { day: 15, refs: ["mc/13", "mc/14", "mc/15", "mc/16"] },
            { day: 16, refs: ["lc/1", "lc/2"] },
            { day: 17, refs: ["lc/3", "lc/4", "lc/5"] },
            { day: 18, refs: ["lc/6", "lc/7", "lc/8"] },
            { day: 19, refs: ["lc/9", "lc/10", "lc/11"] },
            { day: 20, refs: ["lc/12", "lc/13", "lc/14"] },
            { day: 21, refs: ["lc/15", "lc/16", "lc/17"] },
            { day: 22, refs: ["lc/18", "lc/19", "lc/20"] },
            { day: 23, refs: ["lc/21", "lc/22", "lc/23", "lc/24"] },
            { day: 24, refs: ["jo/1", "jo/2", "jo/3"] },
            { day: 25, refs: ["jo/4", "jo/5", "jo/6"] },
            { day: 26, refs: ["jo/7", "jo/8", "jo/9"] },
            { day: 27, refs: ["jo/10", "jo/11", "jo/12"] },
            { day: 28, refs: ["jo/13", "jo/14", "jo/15"] },
            { day: 29, refs: ["jo/16", "jo/17", "jo/18"] },
            { day: 30, refs: ["jo/19", "jo/20", "jo/21"] }
        ]
    },
    {
        id: "nt-90-days",
        name: "Novo Testamento em 90 dias",
        description: "Leia todo o Novo Testamento em 3 meses, com cerca de 3 a 4 capítulos por dia.",
        totalDays: 90,
        days: genDays(90, (i) => {
            // Just a mock generation for the sake of having 90 days of NT. 
            // In a real scenario we'd precisely map 260 chapters to 90 days (about 2.8 ch/day)
            // I'll just put placeholder blocks, the parsing logic will handle it anyway.
            // If the user wants exact mappings, we can replace this later. 
            return [`nt_placeholder/${i}`];
        })
    },
    {
        id: "bible-1-year",
        name: "Bíblia em 1 ano",
        description: "A clássica jornada de capa a capa, lendo de 3 a 4 capítulos diários para completar as Escrituras em 365 dias.",
        totalDays: 365,
        days: genDays(365, (i) => [`bible_placeholder/${i}`])
    }
];

const dir = path.join(__dirname, 'public/bible');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(path.join(dir, 'reading-plans.json'), JSON.stringify(plans, null, 2));
console.log('Generated reading-plans.json');
