//@api-1.0
// version 18
// =========================================
// KREA 2 MODULAR BATCH GENERATOR
// Version 18 — Heritage descriptions replace trait menus
// =========================================

// =========================================
// CONSTANTS
// =========================================

const NONE_SELECTED = 0;

// How many constructed prompts to show verbatim on the review screen.
const PREVIEW_SAMPLE_SIZE = 8;

const ASPECT_OPTIONS = [
    { label: "1:1", width: 1024, height: 1024 },
    { label: "3:4 Portrait", width: 768, height: 1024 },
    { label: "4:3 Landscape", width: 1024, height: 768 },
    { label: "16:9", width: 1024, height: 576 }
];

const ASPECT_DIMENSIONS = ASPECT_OPTIONS.map(({ width, height }) => [width, height]);

// =========================================
// RANDOM HELPERS
// =========================================

function randomInt(maxExclusive) {
    return Math.floor(Math.random() * maxExclusive);
}

function randomElement(array) {
    return array[randomInt(array.length)];
}

// Returns the value of a random preset, skipping presets whose value is
// an empty string (e.g. "No specific shape" sentinels).
function randomPresetValue(presets) {
    const candidates = presets.filter(p => {
        const value = getPresetValue(p);
        return value !== undefined && value !== null && value !== "";
    });
    return candidates.length > 0 ? getPresetValue(randomElement(candidates)) : "";
}

// Picks `count` random switch values from a preset list (no duplicates).
function randomSwitchValues(presets, count) {
    const indices = presets.map((_, i) => i);
    // Fisher-Yates shuffle.
    for (let i = indices.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices.slice(0, Math.min(count, indices.length)).map(i => getPresetValue(presets[i]));
}

const DEFAULT_PROMPT_FALLBACKS = {
    subject: "a woman",
    outfit: "t-shirt and jeans",
    action: "smiling",
    // No default camera perspective — when none is selected, the prompt
    // simply omits any perspective clause instead of forcing eye-level.
    camera: "candid",
    lighting: "soft natural daylight",
    artStyle: "photo",
    genericPrompt: "a portrait of the subject"
};

// Single-model configuration. No Flux, Twin, or Qwen enhancer.
const KREA_MODEL = {
    label: "Krea 2",
    file: "krea_2_turbo_i8x.ckpt",
    loras: [
        { file: "pornmaster_uncensored_krea2_v1_lora_f16.ckpt", weight: 1.0 },
        { file: "mysticxxx_krea2_v3_lora_f16.ckpt", weight: 0.6 }
    ]
};

// =========================================
// PRESETS
// =========================================

// --- GENDER ---
const genderPresets = ["woman", "man"];

// --- NATIONALITY / ETHNICITY ---
const nationalityPresets = [
    { label: "Caucasian", value: "Caucasian with fair skin, soft Western European facial features, hazel eyes, and straight dark blonde hair" },
    { label: "Black", value: "Black with rich deep brown skin, classic African facial features, dark brown eyes, and short coily black hair" },
    { label: "Mixed-Race", value: "Mixed-race with golden-bronze skin, blended African and European features, dark brown eyes, and voluminous dark curls" },
    { label: "Mexican", value: "Mexican with warm olive-tan skin, Indigenous Mesoamerican facial features, dark brown eyes, and thick dark wavy hair" },
    { label: "Indian", value: "Indian with warm brown skin, South Asian facial features, dark brown eyes, and long thick black hair" },
    { label: "Thai", value: "Thai with golden-tan skin, Southeast Asian facial features, dark almond-shaped eyes, and straight black hair" },
    { label: "Japanese", value: "Japanese with fair skin, East Asian facial features, dark brown almond-shaped eyes, and straight black hair" },
    { label: "Korean", value: "Korean with fair porcelain skin, East Asian facial features, dark almond eyes, and sleek straight black hair" },
    { label: "Filipina", value: "Filipina with warm tan skin, Southeast Asian facial features, dark brown eyes, and long dark wavy hair" },
    { label: "Brazilian", value: "Brazilian with sun-kissed olive skin, blended European, African and Indigenous features, brown eyes, and wavy dark hair" },
    { label: "Italian", value: "Italian with warm olive skin, Mediterranean facial features, dark brown eyes, and thick dark wavy hair" },
    { label: "Scandinavian", value: "Scandinavian with fair skin, Nordic facial features, blue eyes, and straight blonde hair" },
    { label: "Russian/Eastern European", value: "Russian with fair skin, Slavic facial features, light grey eyes, and straight light brown hair" },
    { label: "Chinese", value: "Chinese with fair skin, East Asian facial features, dark almond-shaped eyes, and straight black hair" },
    { label: "Vietnamese", value: "Vietnamese with warm tan skin, Southeast Asian facial features, dark almond eyes, and long straight black hair" },
    { label: "Middle Eastern", value: "Middle Eastern with olive skin, striking dark eyes, defined eyebrows, and thick dark wavy hair" },
    { label: "French", value: "French with fair skin, classic Western European features, light brown eyes, and dark brown hair" },
    { label: "German", value: "German with fair skin, Central European facial features, blue-grey eyes, and straight blonde hair" },
    { label: "Irish", value: "Irish with fair freckled skin, Celtic facial features, green eyes, and wavy red hair" },
    { label: "Native American", value: "Native American with warm bronze skin, Indigenous American facial features, dark brown eyes, and long straight black hair" },
    { label: "Polynesian/Pacific Islander", value: "Polynesian with warm brown skin, Polynesian facial features, dark brown eyes, and thick dark wavy hair" },
    { label: "Ethiopian/East African", value: "Ethiopian with deep brown skin, East African facial features, dark expressive eyes, and short coily black hair" }
];


const celebrityPresets = [
    { label: "My Baby", value: "curvy apple-shaped 35-year-old woman with large shapeless drooping breasts, a round ass, long curly 3a black hair, arms covered in red & green rose tattoos, hazel eyes" },
    { label: "Anne Hathaway", value: "Anne Hathaway with a tall slim build with smokey eyes and heavy mascara" },
    { label: "Dolly Parton", value: "young 1970s era Dolly Parton with blown-out blonde hair and bangs" },
    { label: "Sabrina Carpenter", value: "Sabrina Carpenter with shoulder length blonde hair" },
    { label: "Marilyn Monroe", value: "Marilyn Monroe with shoulder length blonde Hollywood curls" },
    { label: "Lisbeth Salander", value: "small petite woman with porcelain skin, a flat chest, narrow hips/shoulders, a short black spiked punk hairstyle shaved on one side, neck tattoos, back tattoos, light body hair, arm and leg tattoos, stacked bracelets, heavy mascara, smokey eyes, eyebrow/lip/septum/nipple/navel piercings, multiple earrings, multiple rings" },
    { label: "Curvy Black Woman with Box Braids", value: "a curvy black woman with warm brown skin, long black box braids, neck/back/arm tattoos, heavy mascara, smokey eyes, light body hair, hoop earrings, long fingernails, nose/navel/nipple piercings" },
    { label: "Curvy Mexican woman", value: "a curvy Mexican woman with prominent Indigenous Mesoamerican features, olive skin, plump lips, medium-length straight black hair, smokey eyes, heavy mascara, arm/back/neck tattoos, light body hair, hoop earrings, multiple rings, nose/navel/nipple piercings" },
    { label: "Mixed race", value: "mixed race with Afro European features, a deep golden-bronze complexion, softly flared nostrils, and a straight natural nose bridge, thick dark brown hair with thick wavy curls, and a round ass." },
    { label: "Petite Korean", value: "small petite Korean woman with short stature, and short straight black hair" },
    { label: "Slim Blonde with Pixie Cut", value: "a slim-build woman with porcelain skin, short blonde hair in a textured pixie cut style" },
    { label: "Oversized head/eyes, small nose", value: "with an unnaturally large head with large eyes and a tiny button nose" },
    { label: "Michelle Obama", value: "Michelle Obama" },
    { label: "Betty Boop", value: "Betty Boop" }
];

// --- AGE ---
const agePresets = [
    "18 years old", "20 years old", "25 years old", "30 years old", "35 years old",
    "40 years old", "45 years old", "50 years old", "55 years old", "60 years old",
    "65 years old", "70 years old", "75 years old", "80 years old", "85 years old"
];

// --- SKIN TONE ---
// --- EYE COLOR ---
// =========================================
// BODY / PHYSIQUE
// =========================================

const overallBuildPresets = [
    { label: "Slim build", value: "slim build" },
    { label: "Soft Fit Frame", value: "toned athletic frame softened by naturally feminine curves, visible but subtle muscle definition" },
    { label: "Average build", value: "average build" },
    { label: "Petite build", value: "petite build with a small overall frame, narrow hips, short stature, narrow shoulders, thin legs, and flat belly" },
    { label: "Curvy build", value: "curvy build with naturally pronounced feminine curves" },
    { label: "Muscular build", value: "muscular build with clearly developed musculature" },
    { label: "Chubby build", value: "chubby build with a softer, fuller physique" },
    { label: "Large frame", value: "large frame with broad shoulders, thick limbs, and a tall, imposing build" }
];

const heightPresets = [
    { label: "Short", value: "short stature with naturally proportioned overall body proportions" },
    { label: "Average", value: "average height and proportions" },
    { label: "Tall", value: "tall stature, noticeably above-average height, long legs and naturally elongated overall proportions" }
];

const chestPresets = [
    { label: "Flat chest", value: "flat chest" },
    { label: "Small chest", value: "small chest" },
    { label: "Average chest", value: "average chest" },
    { label: "Full chest", value: "full chest" },
    { label: "Large breasts", value: "large breasts" }
];

const hipPresets = [
    { label: "Narrow hips", value: "narrow hips" },
    { label: "Average hips", value: "average-width hips" },
    { label: "Wide hips", value: "wide hips with proportionally fuller hips and upper thighs" }
];

const lipsPresets = [
    { label: "Thin lips", value: "thin lips" },
    { label: "Average lips", value: "average lips" },
    { label: "Full lips", value: "full lips" },
    { label: "Plump lips", value: "plump lips" }
];

const eyelashPresets = [
    { label: "Thin eyelashes", value: "thin eyelashes" },
    { label: "Average eyelashes", value: "average eyelashes" },
    { label: "Long eyelashes", value: "long eyelashes" }
];

const bodyShapePresets = [
    { label: "No specific shape", value: "" },
    { label: "Petite frame", value: "petite frame with narrow shoulders, narrow hips, and a small chest" },
    { label: "Hourglass", value: "hourglass body shape with balanced bust and hips and a clearly defined waist" },
    { label: "Pear-shaped", value: "pear-shaped body with narrower shoulders and upper body and proportionally wider hips and thighs" },
    { label: "Rectangle", value: "rectangle body shape with relatively similar shoulder, waist and hip widths" },
    { label: "Inverted triangle", value: "inverted-triangle body shape with broader shoulders and proportionally narrower hips" },
    { label: "Apple-shaped", value: "apple-shaped body with a fuller midsection and relatively slimmer legs" }
];

const legPresets = [
    { label: "Slim legs", value: "slim legs" },
    { label: "Average legs", value: "average legs" },
    { label: "Thick legs", value: "thick legs with fuller thighs" },
    { label: "Toned legs", value: "toned legs with defined but natural musculature" }
];

const assSizePresets = [
    { label: "Small", value: "small, relatively subtle buttocks" },
    { label: "Average", value: "average-sized buttocks with natural proportions" },
    { label: "Large", value: "large, prominently rounded buttocks" },
    { label: "Very large", value: "very large, dramatically rounded buttocks with pronounced volume" }
];

const bellySizePresets = [
    { label: "Flat", value: "flat, relatively lean abdomen" },
    { label: "Average", value: "average abdomen with natural proportions" },
    { label: "Soft", value: "soft, gently rounded abdomen" },
    { label: "Large", value: "prominent, rounded abdomen" },
    { label: "Very large", value: "very large, prominently rounded abdomen" }
];

const specificBodyPresets = [
    { label: "No specific characteristic", value: "" },
    { label: "Adult with achondroplasia", value: "adult with achondroplasia, characteristic short stature and naturally proportioned body" },
    { label: "Pregnant", value: "pregnant adult with a visibly rounded pregnant belly" },
    { label: "Heavily pregnant", value: "heavily pregnant adult with a large, prominently rounded late-stage pregnancy belly" }
];

// =========================================
// APPEARANCE
// =========================================

const makeupPresets = [
    "light makeup", "heavy makeup", "red lipstick", "smokey eyes", "heavy mascara",
    { label: "Lined lips (Chola/Chicana style)", value: "lips lined with a dark brown lip liner a shade darker than the lipstick, filled in with lighter lipstick" }
];
const facialHairPresets = ["short beard", "thick beard"];
const tattooPresets = ["arm tattoo", "back tattoo", "neck tattoos", "sleeve tattoos", "red & green rose tattoos that cover both arms"];
const bodyHairPresets = [
    "light body hair", "thick body hair", "light pubic hair", "thick pubic hair", "a full bush of thick pubic hair",
    "freckles", "dimples", "wrinkles", "sun-kissed tan lines", "sweaty skin",
    "subtle natural stretch marks", "cellulite texture", "visible veins", "beauty mark"
];

const nailPresets = [
    "French tip manicure", "red nail polish", "black nail polish", "nude nail polish",
    "glossy chrome nails", "long stiletto acrylics"
];

const hairDetailPresets = [
    { label: "Shaved on one side", value: "one side of the head shaved" },
    { label: "Shaved on both sides", value: "both sides of the head shaved" }
];

const nosePresets = [
    "straight bridge", "aquiline nose", "button nose", "upturned nose", "hooked nose",
    "flared nostrils", "narrow nostrils", "wide nose", "small nose", "prominent nose"
];

const appearanceSwitchGroups = [
    { title: "Makeup", description: "Makeup and cosmetic styling", presets: makeupPresets },
    { title: "Facial Hair", description: "Facial hair characteristics", presets: facialHairPresets },
    { title: "Nose", description: "Nose bridge, tip, and nostril characteristics (multiple can combine)", presets: nosePresets },
    { title: "Tattoos", description: "Visible tattoo characteristics", presets: tattooPresets },
    { title: "Body / Skin Details", description: "Body hair and skin details", presets: bodyHairPresets },
    { title: "Nails", description: "Manicure and nail styling", presets: nailPresets },
    { title: "Hair Details", description: "Additional hair-shaving and hair-structure details", presets: hairDetailPresets }
];

const hairLengthPresets = ["short", "medium-length", "long", "very long"];
const hairstyleGroups = [
    {
        title: "Updos and braided styles",
        description: "Classic updos and braided hair styling choices",
        presets: [
            "wet hair", "ponytail", "messy ponytail", "French braid", "loose braids",
            "double braids", "cornrows", "box braids", "micro braids", "dreadlocks", "messy bun",
            "messy double buns", "with bangs"
        ]
    },
    {
        title: "Voluminous and retro styling",
        description: "Big-volume and retro-inspired hair silhouettes",
        presets: [
            { label: "blown-out", value: "high-volume, heavily sprayed, lacquered hairstyle" },
            { label: "soft feathered 70s blowout", value: "soft feathered 1970s blowout hairstyle with airy volume, gentle waves, and naturally lifted layers" },
            { label: "60s bouffant curls", value: "1960s bouffant hairstyle with large rounded curls, high volume, and polished lift" }
        ]
    },
    {
        title: "Edgy and stylized cuts",
        description: "More fashion-forward and stylized hair cuts",
        presets: [
            "Faux Hawk",
            { label: "Pixie Cut", value: "in a textured pixie cut style" },
            "spiked punk hairstyle"
        ]
    },
    {
        title: "Iconic curl styles",
        description: "Signature curl and wave-inspired styling choices",
        presets: ["Hollywood curls", "Victory curls"]
    }
];

// =========================================
// ACCESSORIES
// =========================================

const accessoryGroups = [
    {
        title: "Jewelry",
        description: "Select any jewelry accessories to add",
        presets: [
            "stud earrings", "hoop earrings", "large hoop earrings", "drop earrings",
            "necklace", "layered necklaces", "choker", "pendant necklace", "pearl necklace",
            "bracelet", "stacked bracelets", "watch", "rings", "multiple rings", "diamond-studded silver anklet"
        ]
    },
    {
        title: "Eyewear",
        description: "Select eyewear accessories",
        presets: [
            "sunglasses", "aviator sunglasses", "round sunglasses", "cat-eye sunglasses",
            "reading glasses", "clear-frame glasses", "dark sunglasses"
        ]
    },
    {
        title: "Body Piercings",
        description: "Select visible body piercing details",
        presets: ["nose piercing", "septum piercing", "eyebrow piercing", "lip piercing", "multiple ear piercings", "nipple piercings", "navel piercing"]
    },
    {
        title: "Headwear",
        description: "Select headwear accessories",
        presets: ["baseball cap", "beanie", "wide-brim hat", "fedora", "cowboy hat", "sun hat", "beret"]
    },
    {
        title: "Hair Accessories",
        description: "Select accessories worn in or around the hair",
        presets: ["hair clips", "decorative hair pins", "hair ribbon", "headband", "scrunchie", "hair bow", "flower in the hair"]
    }
];

// =========================================
// GENERIC PRESET HELPERS
// =========================================

function unwrapPreset(preset, key) {
    return (typeof preset === "object" && preset !== null) ? preset[key] : preset;
}

function getPresetLabel(preset) {
    return unwrapPreset(preset, "label");
}

function getPresetValue(preset) {
    return unwrapPreset(preset, "value") ?? preset;
}

function presetLabels(presets) {
    return presets.map(getPresetLabel);
}

function menuWithPlaceholder(placeholder, presets) {
    return [placeholder, ...presetLabels(presets)];
}

function findPresetMenuIndex(presets, targetValue) {
    const idx = presets.findIndex(p => getPresetValue(p) === targetValue || getPresetLabel(p) === targetValue);
    return idx >= 0 ? idx + 1 : NONE_SELECTED;
}

function presetSwitches(presets) {
    return presets.map(preset => this.switch(false, `✡︎  ${getPresetLabel(preset)}`));
}

// Reads a menu selection. When `hasPlaceholder` is true, index 0 means
// "nothing selected" and real options start at index 1.
function selectedValueWithPlaceholder(index, presets) {
    if (index <= 0) return "";
    const actualIndex = index - 1;
    if (actualIndex < 0 || actualIndex >= presets.length) return "";
    return getPresetValue(presets[actualIndex]) || "";
}

// Reads a menu selection where every index maps directly to a preset
// (no leading placeholder option).
function selectedValueNoPlaceholder(index, presets) {
    if (index < 0 || index >= presets.length) return "";
    return getPresetValue(presets[index]) || "";
}

function selectedSwitchValues(data, presets) {
    const values = [];
    for (let i = 0; i < presets.length; i++) {
        if (data[i] === true) values.push(getPresetValue(presets[i]));
    }
    return values;
}

function joinParts(parts) {
    return parts.filter(part => part !== undefined && part !== null && part !== "").join(", ");
}

// =========================================
// CLOTHING
// =========================================

const clothingColorPresets = [
    "black", "white", "red", "crimson", "burgundy", "emerald green", "forest green",
    "olive green", "navy blue", "royal blue", "baby blue", "pastel pink", "hot pink",
    "lavender", "purple", "yellow", "orange", "beige", "champagne", "brown", "gold", "silver"
];

function applyClothingColor(item, color) {
    if (!color || !item) return item;
    // Handle article prefixes gracefully: "a loose fitting T-shirt" -> "a black loose fitting T-shirt"
    if (/^a\s+/i.test(item)) {
        return item.replace(/^a\s+/i, `a ${color} `);
    }
    if (/^an\s+/i.test(item)) {
        return item.replace(/^an\s+/i, `a ${color} `);
    }
    return `${color} ${item}`;
}

const clothingGroups = [
    {
        title: "Tops",
        description: "Upper-body styling and color",
        hasColorMenu: true,
        presets: [
            "a loose fitting T-shirt",
            "a fitted T-shirt",
            "a tank top",
            { label: "a short crop top", value: "a crop-top t-shirt showing significant underboob" },
            "a blouse",
            "a halter top",
            "off-shoulder top",
            "an unbuttoned mens dress shirt",
            "a hoodie"
        ]
    },
    {
        title: "Bottoms",
        description: "Skirts, shorts, bottoms, and color",
        hasColorMenu: true,
        presets: [
            "jeans",
            "shorts",
            "cutoff jean shorts",
            "spandex leggings",
            "mini-skirt",
            "pleated mini-skirt",
            "wrap-around skirt"
        ]
    },
    {
        title: "Dresses",
        description: "Dress and one-piece styles and color",
        hasColorMenu: true,
        presets: [
            "a short babydoll dress", "a summer dress", "a multicolored sari",
            "a burqa", "a nun's habit", "a traditional wedding dress",
            "an edgy racy wedding dress", "a full-length evening gown",
            "a lowcut full-length sheer dress with side pockets", "cut-out dress with a side slit from her waist down"
        ]
    },
    {
        title: "Lingerie",
        description: "Lingerie, underlayers, and color",
        hasColorMenu: true,
        presets: [
            "nude", "bikini-style panties", "thong", "high-waisted thong bottoms", "garter belt",
            "lace bustier", "silk lingerie set", "black lace lingerie set", "red satin lingerie set",
            "sheer lace teddy", "transparent lace bra and panties", "lace-up corset", "satin chemise",
            "balconette bra and matching panties", "lace garter set",
            "leather lingerie set", "silk robe", "silk robe and lingerie set", "fishnet bodysuit",
            "push-up bra and thong set", "strapless corset set",
            "sheer robe with matching panties", "satin slip dress", "lace-up bustier set",
            "corset over stockings"
        ]
    },
    {
        title: "Swimwear",
        presets: [
            "one-piece swimsuit", "two-piece bikini", "micro bikini", "string bikini"
        ]
    },
    {
        title: "Robes / Loungewear",
        description: "Robes and casual lounging outfits",
        presets: ["kimono robe", "silk cami and shorts set"]
    },
    {
        title: "Sets",
        description: "Specialty outfit presets",
        presets: [
            { label: "Champagne Silk Pajama Set", value: "champagne-colored silk pajama set with shorts that show ample thigh" },
            { label: "a lace bustier, garter belt and thigh-high stockings", value: "a lace bustier, garter belt and thigh-high stockings" }
        ]
    },
    {
        title: "Uniforms",
        description: "Uniform-style outfit presets",
        presets: [
            { label: "French Maid Uniform", value: "black French maid uniform with short pleated skirt and white collar" },
            { label: "Hooters Uniform", value: "Hooters uniform (tight-fitting white T-shirt with the Hooters logo across the chest and short tight-fitting orange shorts)" },
            { label: "Schoolgirl Uniform", value: "a schoolgirl uniform with a short pleated skirt and thigh-high white socks. {possessive} shirt is unbuttoned down to {possessive} navel, revealing deep cleavage." },
            { label: "Sexy Nurse", value: "a sexy nurse's uniform, showing ample cleavage, and a nurse's cap" }
        ]
    },
    {
        title: "Costume Oddities",
        description: "Unconventional and surreal costume presets",
        presets: [
            "a gimp mask",
            "a latex catsuit",
            { label: "mascot-style animal onesie, unzipped", value: "a mascot-style animal onesie, unzipped" },
            { label: "marionette/puppet aesthetic", value: "a marionette/puppet aesthetic with visible joint seams and strings" }
        ]
    },
    {
        title: "Period Fashion",
        description: "1940s WWII-era and 1960s mid-century styling",
        presets: [
            { label: "1940s WWII Women's Ensemble", value: "1940s WWII-era women's ensemble: A-line tea dress with a fitted waist, padded shoulders, and Victory Roll hairstyle" },
            { label: "1940s WWII Flight Jacket", value: "1940s WWII-style leather flight jacket worn over a white dress" },
            { label: "1940s Sailor Uniform", value: "1940s-style navy sailor uniform with a white collar and navy tie" },
            { label: "1960s Mod Shift Dress", value: "1960s Mod shift dress with a geometric pattern, bold graphic print, and knee-length hem" },
            { label: "1960s Cocktail Dress", value: "1960s cocktail dress with a fitted bodice, flared A-line skirt, and elbow-length gloves" },
            { label: "1960s Turtleneck & Slacks", value: "1960s beatnik turtleneck paired with high-waisted slacks" },
            { label: "1960s Go-Go Outfit", value: "1960s go-go dress with white go-go boots" },
            { label: "1960s Pillbox Ensemble", value: "1960s pillbox hat and tailored suit ensemble with a boxy jacket and pencil skirt" }
        ]
    },
    {
        title: "Footwear",
        description: "Shoes, socks, legwear, and color",
        hasColorMenu: true,
        presets: [
            "barefoot", "tube socks", "knee-high Hello Kitty socks", "knee-high Pokemon socks",
            "black fishnet stockings", "sheer lace stockings", "strappy heels", "lace-up knee boots",
            "platform boots", "stiletto heels", "cowboy boots", "thigh-high stockings", "thigh-high leather boots",
            "lace-up thigh-highs"
        ]
    }
];

const clothingPresets = [
    {
        label: "Bustier/Garter/Stockings",
        value: "a lace bustier, a garter belt, and thigh-high stockings"
    },
    {
        label: "Leather Punk Lingerie",
        value: "leather lingerie, a fishnet bodysuit, and thigh-high leather boots"
    },
    {
        label: "French Maid Uniform",
        value: "black French maid uniform with short pleated skirt and white collar"
    },
    {
        label: "Hooters Uniform",
        value: "Hooters uniform (tight-fitting white T-shirt with the Hooters logo across the chest and short tight-fitting orange shorts)"
    }
];

// =========================================
// COMPOSITE POSES
// =========================================

const complexActionPresets = [
    { label: "Wall Pose — back against wall, arms raised, one knee bent", value: "leaning back against a wall, with one knee bent with the foot pressed against the wall, arms raised high above head and hands clasped, lips parted.", tags: ["indoor", "location", "standing"] },
    { label: "Wall Pose — back against wall, arms down, one knee bent", value: "leaning back against a wall, with one knee bent with the foot pressed against the wall, arms at {possessive} sides, pressed against the wall, lips parted.", tags: ["indoor", "location", "standing"] },
    { label: "Bed Lean (on elbows) — elbows on bed, ass toward camera", value: "standing at the edge of a bed, leaning forward, feet on floor, elbows on the bed, pushing {possessive} ass toward the camera", tags: ["indoor", "location", "floor", "handsBusy"] },
    { label: "Bed Lean (face-down) — cheek on mattress, looking sideways", value: "standing at the edge of a bed, leaning forward, feet on floor, one cheek touching the bed, looking to the side at the camera, pushing {possessive} ass toward the camera", tags: ["indoor", "location", "floor"] },
    { label: "Ass-Up Lean (on bed or floor) — on knees, face forward, back arched", value: "on {possessive} knees, leaning forward, {possessive} face in the foreground, back arched, ass high in the air, arms stretched out in front of {objectPronoun}", tags: ["indoor", "location", "floor", "handsBusy"] },
    { label: "Deep Squat, Viewed From Below — knees wide, toes pointed, hands on knees", value: "worms-eye view, squatting with {possessive} knees spread wide and on the tips of {possessive} toes, hands resting on {possessive} knees", tags: ["indoor", "location"] },
    { label: "Cross-Legged Floor Sit — seated, leaning back, relaxed smile", value: "sitting cross-legged on the floor, leaning back slightly on {possessive} hands, looking directly into the camera with a relaxed smile", tags: ["indoor", "location", "floor", "sitting"] },
    { label: "Spread Eagle (Lying Back) — lying back, legs spread wide, hands holding legs", value: "laying on {possessive} back with {possessive} legs raised and spread wide, feet wide apart, holding {possessive} legs in the air with {possessive} hands, looking through {possessive} open legs at the camera", tags: ["indoor", "location", "floor"] },
    { label: "Back-on-Bed (Legs Straight Up) — legs straight and elevated, knees locked", value: "laying on a bed on {possessive} back with {possessive} butt at the edge of the bed, {possessive} legs straight and elevated into the air, knees locked, bending at waist only", tags: ["indoor", "location", "floor"] },
    { label: "Deep Waist Bend — legs straight, hands on shelf, surprise look", value: "leaning forward to grab something off of a lower level of a bookshelf, legs straight, knees locked, bending at waist only, looking at the camera sideways, with {possessive} hand covering {possessive} mouth and wide-eyed open-mouthed look of surprise", tags: ["indoor", "location", "standing"] },
    { label: "Shower View (From Below) — camera below, looking up through water", value: "standing and rubbing soapy lather all over {possessive} body in the shower with a soapy loofah, water and soap cascading down {possessive} nude body, looking up at the water as it streams out of the showerhead, the camera sitting candidly below {objectPronoun} looking up", tags: ["indoor", "location", "water"] },
    { label: "Shower View (From Above)", value: "standing and rubbing soapy lather all over {possessive} body in the shower with a soapy loofah, water and soap cascading down {possessive} nude body, looking up at the water as it streams out of the showerhead, the camera sitting candidly above {objectPronoun} looking down", tags: ["indoor", "location", "water"] },
    { label: "Shower View (With a Man)", value: "standing and rubbing soapy lather all over a man's nude body in the shower with a soapy loofah, water streaming out of the showerhead onto their nude bodies", tags: ["indoor", "location", "water"] },
    { label: "Doorway Pose — foot on frame, knee near face", value: "standing in a bedroom doorway. {possessive} back is against one side of the door frame, and one of {possessive} feet is elevated to eye-level and the sole of {possessive} shoe is pressing against the opposite door frame, putting {possessive} knee close to {possessive} face.", tags: ["indoor", "location", "standing"] },
    { label: "Doorway Pose (Just Standing)", value: "standing in a bedroom doorway.", tags: ["indoor", "location", "standing"] },
    { label: "Forward Lean (hands on knees) - facing back, ass toward camera", value: "standing, facing away from the camera, leaning forward, {possessive} ass toward the camera, hands on {possessive} knees, looking back at the camera, legs straight, knees locked", tags: ["indoor", "location", "standing"] },
    { label: "Reclining back - resting on elbow, other hand touching crotch", value: "lying on {possessive} side, with the top leg bent high, hand lightly between {possessive} thighs", tags: ["indoor", "location", "floor"] },
    { label: "Morning Stretch", value: "standing, mid-stretch reaching both arms overhead while rising up on {possessive} toes, hands in {possessive} hair, back arched, chest pressed forward, shoulders pulled back.", tags: ["indoor"] },
    { label: "Lying in a Windowsill", value: "lying on {possessive} stomach on a sunlit windowsill, chin resting on {possessive} hands, legs bent at the knees and crossed at the ankles in the air", tags: ["indoor", "location", "floor"] },
    { label: "Lying on a Couch (Foot on Backrest)", value: "lying on {possessive} back on a sofa, one leg hooked over the backrest, other foot on the floor", tags: ["indoor", "location", "floor"] },
    { label: "Lying on a Couch (Foot on Armrest)", value: "lying on {possessive} back on a sofa, one leg resting on opposite armrest, other foot on the floor", tags: ["indoor", "location", "floor"] },
    { label: "On Knees, Ass Spread", value: "{subjectPronoun} is on {possessive} knees facing away, looking back over {possessive} shoulder while reaching back to spread {possessive} ass cheeks apart", tags: ["indoor", "location", "floor", "handsBusy"] },
    { label: "Kneeling in Front of a Fireplace - wearing pearls and heels", value: "kneeling on a soft rug in front of a fireplace, hands on {possessive} thighs, chest pushed forward, wearing a long pearl necklace and high heels", tags: ["indoor", "location", "floor"] },
    { label: "On All Fours", value: "on all fours, head turned to the side, back arched hard, ass toward the camera", tags: ["floor", "handsBusy"] },
    { label: "Crawling Toward Camera", value: "crawling toward the camera on all fours", tags: ["floor", "handsBusy"] },
    { label: "Leaning over Counter in Kitchen - in an Apron", value: "standing, leaning over a kitchen counter, resting on elbows, ass pushed out, looking back at camera, wearing only a tiny apron.", tags: ["indoor", "location", "standing"] },
    { label: "Bathroom Mirror Selfie", value: "taking a selfie in a bathroom mirror", tags: ["indoor", "location", "standing"] },
    { label: "Full-Length Mirror Reflection (standing)", value: "standing in front of a full-length mirror while pulling {possessive} hair up", tags: ["indoor", "location", "standing"] },
    { label: "Full-Length Mirror Reflection (sitting)", value: "sitting in front of a full-length mirror looking at {possessive} reflection", tags: ["indoor", "location", "sitting"] },
    { label: "Applying Lipstick in a Bathroom", value: "standing in a bathroom, leaning over the counter, close to the mirror, applying deep red lipstick. Facing away from the camera.", tags: ["indoor", "location"] },
    { label: "Shy, in a Doorway", value: "standing in a bedroom doorway, {subjectPronoun} is touching {possessive} index finger to {possessive} bottom lip with a shy embarrassed smile and biting {possessive} bottom lip. {possessive} legs are crossed and {possessive} free hand is above {possessive} head touching the door frame.", tags: ["indoor", "location", "standing"] },
    { label: "Leaning against Glass Door on a Balcony", value: "leaning against a glass door on the balcony of a third-floor Manhattan apartment. {possessive} legs are crossed and {subjectPronoun} is smoking a cigarette, blowing the smoke up into the air.", tags: ["outdoor", "location", "standing"] }
];

// =========================================
// MODULAR POSE SWITCHES
// =========================================

const actionGroups = [
    {
        title: "Position",
        description: "Pose setup choices",
        presets: [
            { label: "standing", value: "standing", tags: ["standing"] },
            { label: "standing in a doorway", value: "standing in a doorway", tags: ["standing", "location", "indoor"] },
            { label: "sitting", value: "sitting", tags: ["sitting"] },
            { label: "laying", value: "laying", tags: ["floor"] },
            { label: "on {possessive} back", value: "on {possessive} back", tags: ["floor"] },
            { label: "on {possessive} side", value: "on {possessive} side", tags: ["floor"] },
            { label: "facedown", value: "facedown", tags: ["floor", "handsBusy"] },
            { label: "on a bed", value: "on a bed", tags: ["floor", "location", "indoor"] },
            { label: "on a thick carpeted floor", value: "on a thick carpeted floor", tags: ["floor", "location", "indoor"] },
            { label: "on {possessive} hands and knees", value: "on {possessive} hands and knees", tags: ["floor", "handsBusy"] },
            { label: "crawling toward the camera", value: "crawling toward the camera", tags: ["floor", "handsBusy"] },
            { label: "{possessive} butt at the edge of the bed", value: "{possessive} butt at the edge of the bed", tags: ["floor", "location", "indoor"] },
            { label: "{possessive} face in the foreground", value: "{possessive} face in the foreground", tags: [] }
        ]
    },
    {
        title: "Sexual Positions",
        description: "Sexual positions",
        type: "menu",
        placeholder: "No signature pose selected",
        presets: [
            {
                label: "Cowgirl (leaning back)",
                value: "straddling a nude man, riding him in cowgirl position, leaning back, his penis is deep inside {possessive}"
            },
            {
                label: "Cowgirl (leaning forward)",
                value: "straddling a nude man, riding him in cowgirl position, leaning forward with her arms in front of her, his penis is deep inside {possessive}"
            },
            {
                label: "Blowjob",
                value: "between a nude man's legs, giving him a passionate blowjob, his penis deep inside {possessive} mouth, sucking the penis, sunken cheeks"
            },
            {
                label: "Missionary (POV)",
                value: "POV, hovering on top of a nude woman in missionary position, looking down at {objectPronoun} as {subjectPronoun} lies on {possessive} back beneath the camera with {possessive} legs spread, his penis deep inside {possessive}"
            },
            {
                label: "Missionary (Landscape)",
                value: "a man is hovering on top of a nude woman in missionary position, looking down at {objectPronoun} as {subjectPronoun} lies on {possessive} back beneath him with {possessive} legs spread, his penis deep inside {possessive}"
            },
            {
                label: "Doggystyle",
                value: "of the {personNoun} on all fours and a man is behind {possessive}. His penis is deep inside {possessive}."
            },
            {
                label: "Intimate Embrace",
                value: "looking at a man and {personNoun}, both nude, locked in a passionate embrace with their arms and legs intertwined, exploring each other's bodies."
            },
            {
                label: "Reverse Cowgirl (Portrait)",
                value: "of a nude {personNoun} straddling a man in reverse cowgirl position, facing away from him with {possessive} back to the camera, riding him, his penis deep inside {possessive}"
            },
            {
                label: "Spooning (Portrait)",
                value: "lying on {possessive} side with a man pressed behind {objectPronoun} in spooning position, his penis deep inside {possessive} from behind"
            },
            {
                label: "Standing, Face-to-Face (Portrait)",
                value: "a nude {personNoun} stands face-to-face with a man, one leg lifted and wrapped around his waist, pressed against him, his penis deep inside {possessive}"
            },
            {
                label: "69",
                value: "a nude {personNoun} and a man lying in opposite directions, feet to head, together in a 69 position, each pleasuring the other orally at the same time. His head is between {possessive} legs."
            },
            {
                label: "Cunnilingus (From Above, Portrait)",
                value: "High-angle. She's laying on her back with her legs spread wide. A man is kneeling between her spread legs, looking up at her while performing oral sex on her, her head tilted back in pleasure"
            },
            {
                label: "Legs-on-Shoulders Missionary",
                value: "lying on her back with her legs raised high and resting on the shoulders of a man on his hands and knees hovering over {possessive}. The man is looking down at {possessive} as his penis is deep inside {possessive}"
            },
            {
                label: "Against the Wall",
                value: "a man presses a nude {personNoun} against a wall, both of {possessive} legs lifted around his waist, suspended in air as he holds {possessive} aloft. His penis is deep inside {possessive}"
            },
            {
                label: "Bent Over Counter/Table (Landscape)",
                value: "a nude {personNoun} bent over a counter with a man standing behind {objectPronoun}, hands braced on the surface, his penis deep inside {possessive} from behind"
            },
            {
                label: "Standing Doggystyle",
                value: "of a man standing behind a nude {personNoun} who is bent forward at the waist, hands braced on {possessive} knees, his penis deep inside {possessive} from behind"
            }
        ]
    },
    {
        title: "Legs",
        description: "Leg and body alignment",
        presets: [
            { label: "legs straight", value: "legs straight", tags: [] },
            { label: "legs elevated into the air", value: "legs elevated into the air", tags: [] },
            { label: "feet elevated into the air", value: "feet elevated into the air", tags: [] },
            { label: "knees locked", value: "knees locked", tags: ["upright"] },
            { label: "knees bent", value: "knees bent", tags: [] },
            { label: "one knee bent", value: "one knee bent", tags: [] },
            { label: "one leg raised", value: "one leg raised", tags: [] },
            { label: "one foot on the wall", value: "one foot on the wall", tags: ["upright"] },
            { label: "feet spread wide", value: "feet spread wide", tags: [] },
            { label: "feet together", value: "feet together", tags: ["upright"] },
            { label: "feet crossed", value: "feet crossed", tags: ["upright"] },
            { label: "1 foot against door frame", value: "1 foot against door frame", tags: ["upright"] },
            { label: "{possessive} ass high in the air", value: "{possessive} ass high in the air", tags: [] },
            { label: "back arched", value: "back arched", tags: [] },
            { label: "chest puffed out", value: "chest puffed out", tags: ["upright"] },
            { label: "knees together", value: "knees together", tags: [] },
            { label: "shoulders back", value: "shoulders back", tags: ["upright"] },
            { label: "leaning forward", value: "leaning forward", tags: ["upright"] },
            { label: "bending at waist only", value: "bending at waist only", tags: ["upright"] }
        ]
    },
    {
        title: "Arms",
        description: "Hand and arm placement",
        presets: [
            { label: "arms raised high above {possessive} head", value: "arms raised high above {possessive} head", tags: ["hands"] },
            { label: "arms stretched out in front of {objectPronoun}", value: "arms stretched out in front of {objectPronoun}", tags: ["hands"] },
            { label: "hands clasped together", value: "hands clasped together", tags: ["hands"] },
            { label: "on {possessive} elbows", value: "on {possessive} elbows", tags: ["hands"] },
            { label: "elbows resting on bed", value: "elbows resting on bed", tags: ["hands"] },
            { label: "hands on hips", value: "hands on hips", tags: ["hands"] },
            { label: "hands on waist", value: "hands on waist", tags: ["hands"] },
            { label: "hands on breasts", value: "hands on breasts", tags: ["hands"] },
            { label: "hands in hair", value: "hands in hair", tags: ["hands"] },
            { label: "hands on knees", value: "hands on knees", tags: ["hands"] },
            { label: "hands lightly touching upper chest area", value: "hands lightly touching upper chest area", tags: ["hands"] },
            { label: "hands on ass", value: "hands on ass", tags: ["hands"] },
            { label: "hands spreading ass cheeks", value: "hands spreading ass cheeks", tags: ["hands"] }
        ]
    },
    {
        title: "Gaze",
        description: "Looking and facing choices",
        presets: [
            "looking at camera",
            "looking away from camera",
            "looking off to the side",
            "looking down",
            "looking up",
            "looking over {possessive} shoulder",
            "head tilted to the side",
            "head turned to the side",
            "facing camera",
            "facing away from camera",
            "ass toward the camera",
            "eyes closed",
            "squinting"
        ]
    },
    {
        title: "Expression",
        description: "Face and expression",
        presets: ["lips parted", "smiling", "chin tilted up", "head tilted up", "head tilted down"]
    },
    {
        title: "Setting",
        description: "Scene and environment",
        presets: [
            { label: "in the shower", value: "in a walk-in shower, with wet hair and wet body, water cascading down {possessive} wet body", tags: ["indoor", "water"] },
            { label: "in a bedroom", value: "in a bedroom", tags: ["indoor"] },
            { label: "in a kitchen", value: "in a kitchen", tags: ["indoor"] },
            { label: "in the backseat of a car", value: "in the backseat of a car", tags: ["indoor"] },
            { label: "in a surgical theatre", value: "in a surgical theatre", tags: ["indoor"] },
            { label: "in a crowded city street", value: "in a crowded city street", tags: ["outdoor", "urban"] },
            { label: "in a glade", value: "in a glade", tags: ["outdoor", "nature"] },
            { label: "on an office desk", value: "on an office desk", tags: ["indoor"] },
            { label: "at a poolside", value: "at a poolside", tags: ["outdoor", "water"] },
            { label: "on a beach at sunset", value: "on a beach at sunset", tags: ["outdoor", "water"] },
            { label: "in a nightclub", value: "in a nightclub", tags: ["indoor", "night"] },
            { label: "in a hotel room", value: "in a hotel room", tags: ["indoor"] },
            { label: "on a rooftop at night", value: "on a rooftop at night", tags: ["outdoor", "night"] },
            { label: "in an elevator", value: "in an elevator", tags: ["indoor"] },
            { label: "in a library", value: "in a library", tags: ["indoor"] },
            { label: "in a locker room", value: "in a locker room", tags: ["indoor"] }
        ]
    }
];

// =========================================
// ART STYLE
// =========================================

const artStylePresets = [
    "photo",
    { label: "1940s Pinup", value: "1940s era pinup oil painting in the style of Gil Elvgren and Alberto Vargas" },
    { label: "Disney/Pixar Animation", value: "Disney-Pixar style animation with exaggerated features and expressions: large expressive eyes, small noses" },
    { label: "Claymation", value: "Claymation style, sculpted polymer clay figure, soft tactile texture, fingerprint details, handcrafted stop-motion aesthetic, tilt-shift depth of field" },
    { label: "Pop Art/Comic Book", value: "1960s Pop Art style, Roy Lichtenstein aesthetic, bold black ink outlines, sharp Ben-Day dots, vibrant primary colors, graphic retro comic illustration" },
    { label: "Modern Vector/Flat Illustration", value: "Sleek vector illustration, clean lines, minimalist shading, bold flat color palette, mid-century graphic poster art style" },
    { label: "Cyberpunk Anime/Cell-Shaded", value: "90s hand-drawn anime style, classic cell-shading, vibrant neon rim lighting, retro sci-fi aesthetic, detailed line art" },
    { label: "Vintage Pulp Fiction Cover", value: "1950s pulp magazine cover illustration, dramatic dramatic chiaroscuro lighting, painted gouache texture, vibrant retro paperback aesthetic" },
    { label: "Oil Painting/Impressionism", value: "Impressionist oil painting, thick impasto brushstrokes, textured canvas, dramatic lighting, rich paint texture in the style of John Singer Sargent" },
    { label: "Watercolors", value: "Soft watercolor painting, fluid ink wash, gentle color bleeding, painterly splatters, delicate lines on textured watercolor paper" },
    { label: "Papercraft/Layered Paper", value: "Layered papercraft illustration, laser-cut paper art, soft drop shadows, clean geometric depth, tactile paper texture" },
    { label: "3D Stylized Game Character", value: "Overwatch/Arcane stylized 3D render, smooth painted textures, dramatic cinematic lighting, semi-realistic proportions, clean character art" },
    { label: "Chibi/Kawaii 3D", value: "Chibi 3D figurine, oversized head, expressive shiny eyes, smooth vinyl toy finish, soft studio lighting" }
];

// =========================================
// CAMERA
// Perspective, framing, composition, and depth of field are all
// offered together in the "Camera" section so none of these lists
// go unused.
// =========================================

const cameraFramingPresets = [
    { label: "Close-up", value: "close-up framing focused tightly on the subject" },
    { label: "Waist-up", value: "waist-up framing" },
    { label: "Full body", value: "full-body framing with the entire subject visible" },
    { label: "Wide shot", value: "wide shot showing the subject and surrounding environment" }
];

const cameraPerspectivePresets = [
    { label: "Candid", value: "candid" },
    { label: "Eye level", value: "natural eye-level perspective" },
    { label: "Low angle", value: "low-angle perspective looking upward toward the subject" },
    { label: "High angle", value: "high-angle perspective looking downward toward the subject" },
    { label: "Side view", value: "side-view camera perspective" },
    { label: "POV", value: "POV" },
    { label: "Dutch angle", value: "tilted dutch-angle perspective" }
];

const depthOfFieldPresets = [
    { label: "Deep focus", value: "deep depth of field with the subject and environment clearly in focus" },
    { label: "Moderate", value: "moderate depth of field with gentle background separation" },
    { label: "Shallow", value: "shallow depth of field with the subject sharply focused against a softly blurred background" },
    { label: "Very shallow", value: "very shallow depth of field with strong background blur and pronounced subject isolation" }
];

const cameraCompositionPresets = [
    { label: "Centered", value: "centered composition" },
    { label: "Off-center", value: "off-center composition with intentional visual balance" },
    { label: "Symmetrical", value: "symmetrical composition with balanced visual elements" }
];

// All camera-related pick lists combined into one flat menu of options,
// since the UI only exposes a single "Camera" picker per slot.
const cameraOptionsPresets = [
    ...cameraPerspectivePresets,
    ...cameraFramingPresets,
    ...cameraCompositionPresets,
    ...depthOfFieldPresets
];

// =========================================
// LIGHTING
// =========================================

const lightingPresets = [
    { label: "Soft daylight", value: "soft natural daylight", tags: ["outdoor", "day"] },
    { label: "Golden hour", value: "warm golden-hour sunlight", tags: ["outdoor", "day"] },
    { label: "Overcast", value: "soft overcast daylight", tags: ["outdoor", "day"] },
    { label: "Window light", value: "soft window light", tags: ["indoor", "day"] },
    { label: "Studio", value: "bright soft studio lighting", tags: ["indoor"] },
    { label: "Low-key dramatic", value: "moody low-key lighting with deep shadows", tags: ["indoor", "night"] },
    { label: "Candlelight", value: "warm candlelight glow", tags: ["indoor", "night"] },
    { label: "Moonlight", value: "cool moonlight", tags: ["outdoor", "night"] },
    { label: "Neon night", value: "neon street lighting at night", tags: ["outdoor", "night", "urban"] },
    { label: "Warm lamps", value: "warm interior lamp lighting", tags: ["indoor", "night"] }
];
const colorTreatmentPresets = [
    { label: "Black & white", value: "black-and-white monochrome treatment" },
    { label: "Sepia", value: "sepia-toned treatment" },
    { label: "High-contrast noir", value: "high-contrast noir-style treatment" },
    { label: "Soft monochrome", value: "soft monochrome treatment" },
    { label: "1970s Polaroid", value: "1970s Polaroid film aesthetic with warm tones, soft contrast, and instant-photo color drift" },
    { label: "1940s Kodachrome", value: "1940s Kodachrome-inspired color treatment with rich saturated tones, gentle contrast, and nostalgic vintage color rendering" },
    { label: "1960s slide film", value: "1960s slide film aesthetic with vibrant saturated colors, slightly warm highlights, and crisp vintage transparency look" },
    { label: "1950s magazine print", value: "1950s magazine-print color treatment with polished glossy tones, soft bloom, and clean mid-century editorial color balance" },
    { label: "1980s VHS", value: "1980s VHS aesthetic with slightly washed-out color, magnetic noise, analog softness, and retro cassette-era warmth" },
    { label: "1930s Agfacolor", value: "1930s Agfacolor-inspired treatment with slightly muted early color film tones and classic pre-war photographic softness" },
    { label: "1970s Technicolor", value: "1970s Technicolor-inspired treatment with saturated cinematic color, rich contrast, and glossy studio-film look" },
    { label: "2000s disposable camera", value: "2000s disposable-camera aesthetic with soft focus, slight color cast, and nostalgic point-and-shoot film imperfections" },
    { label: "1990s Fuji film", value: "1990s Fuji film-inspired treatment with smooth color transitions, slightly warm highlights, and clean nostalgic analog tone" },
    { label: "1960s Eastmancolor", value: "1960s Eastmancolor-inspired treatment with rich yet soft color, gentle contrast, and mid-century studio warmth" },
    { label: "1980s neon synthwave film", value: "1980s neon synthwave film treatment with vivid synthetic colors, glossy contrast, and retro-futurist glow" },
    { label: "1950s Anscochrome", value: "1950s Anscochrome-inspired treatment with soft pastel tones, slightly hazy color, and warm editorial sweetness" }
];

// =========================================
// UI HELPERS
// =========================================

function sectionTitle(prefix, ...parts) {
    return [prefix, ...parts].join(" • ");
}

function addPresetSwitchSection(fields, title, description, presets, colorMenu = false) {
    const controls = [];
    if (colorMenu) {
        controls.push(this.menu(NONE_SELECTED, menuWithPlaceholder("Choose color (optional)", clothingColorPresets)));
        controls.push(this.textField("", "Custom color / fabric (optional)", false, 30));
    }
    controls.push(...presetSwitches.call(this, presets));
    fields.push(this.section(title, description, controls));
}

function addPresetMenuSection(fields, title, description, presets, placeholder) {
    fields.push(this.section(
        title,
        description,
        [this.menu(NONE_SELECTED, menuWithPlaceholder(placeholder, presets))]
    ));
}

// Adds one section per group in `groups`, each named
// "<titlePrefix> • <group.title>".
function addGroupedSections(fields, titlePrefix, groups) {
    for (const group of groups) {
        if (group.type === "menu") {
            addPresetMenuSection.call(
                this,
                fields,
                sectionTitle(titlePrefix, group.title),
                group.description,
                group.presets,
                group.placeholder || "No option selected"
            );
            continue;
        }

        addPresetSwitchSection.call(
            this,
            fields,
            sectionTitle(titlePrefix, group.title),
            group.description,
            group.presets,
            Boolean(group.hasColorMenu)
        );
    }
}

// =========================================
// IMAGE COUNT OPTIONS (top section of the input screen below)
// =========================================
// The old Batch Setup screen and generation modes are gone: there is one
// behavior — anything not selected is randomized per image.
const IMAGE_COUNTS = [1, 3, 5, 10];
const subjectCount = 1;
const outfitCount = 1;
const actionCount = 1;
const cameraCount = 1;
const artStyleCount = 1;

function getSelectedAspectOptions(selections) {
    const selected = ASPECT_OPTIONS.filter((_, i) => selections[i] === true);
    return selected.length ? selected : [ASPECT_OPTIONS[0]];
}

// =========================================
// STEP 1 — INPUT SCREEN
// =========================================

const inputs = requestFromUser("Batch Prompts", "Generate", function () {
    const fields = [];

    // -----------------------------------------
    // BATCH (image count + aspect ratios)
    // -----------------------------------------
    fields.push(this.section(
        "❖  Batch",
        "Anything you don't pick below is randomized per image.",
        [
            this.menu(2, IMAGE_COUNTS.map(n => `${n} image${n === 1 ? "" : "s"}`)),
            ...ASPECT_OPTIONS.map(option => this.switch(option.label === "1:1", option.label))
        ]
    ));

    // -----------------------------------------
    // SUBJECTS
    // -----------------------------------------
    for (let i = 0; i < subjectCount; i++) {
        const subjectPrefix = `❖  SUBJECT ${i + 1}`;

        fields.push(this.section(
            sectionTitle(subjectPrefix, "Celebrity/Character Presets"),
            "Optional celebrity-inspired and character presets",
            [this.menu(NONE_SELECTED, menuWithPlaceholder("No celebrity/character preset selected", celebrityPresets))]
        ));

        if (i === 0) {
            // -----------------------------------------
            // PROMPT OPTIONS / TEMPLATE
            // -----------------------------------------
            fields.push(this.section(
                "❖  Prompt Options & Template",
                "Pick an art style manually, or leave unselected to randomize. Customize the template with tags.",
                [
                    ...Array.from({ length: artStyleCount }, (_, idx) =>
                        this.menu(
                            NONE_SELECTED,
                            menuWithPlaceholder("🎲 Random art style (or pick one)", artStylePresets)
                        )
                    ),
                    this.textField(
                        "A {descriptor} {artStyle} of {gender}, {nationality}, {action}, {description}. {subjectPronoun} is wearing {clothing}. {lighting}. Natural anatomy",
                        "Prompt Template — tags: {descriptor}, {artStyle}, {gender}, {nationality}, {description}, {action}, {clothing}, {lighting}, {colorTreatment}, {subjectPronoun}, {objectPronoun}, {possessive}, {reflexive}, {personNoun}.",
                        false,
                        80
                    )
                ]
            ));

            // -----------------------------------------
            // CAMERA
            // -----------------------------------------
            fields.push(this.section(
                "❖  CAMERA • Options",
"Pick a camera angle/framing/composition manually, or leave unselected to randomize",
                Array.from({ length: cameraCount }, () =>
                    this.menu(
                        NONE_SELECTED,
                        menuWithPlaceholder("🎲 Random camera option (or pick one)", cameraOptionsPresets)
                    )
                )
            ));

            // -----------------------------------------
            // MOOD / AESTHETIC / HISTORICAL MEDIA
            // -----------------------------------------
            fields.push(this.section(
                "❖  Mood / Aesthetic / Historical Media",
                "Pick a treatment manually, or leave unselected for none (not randomized — often overpowering)",
                [this.menu(NONE_SELECTED, menuWithPlaceholder("None (or pick one)", colorTreatmentPresets))]
            ));
        }

        fields.push(this.section(
            sectionTitle(subjectPrefix, "Identity"),
            "Manually pin any trait, or leave unselected to randomize it",
            [
                this.menu(
                    NONE_SELECTED,
                    menuWithPlaceholder("🎲 Random gender (or pick one)", genderPresets)
                ),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random nationality (or pick one)", nationalityPresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random age (or pick one)", agePresets)),
            ]
        ));

        fields.push(this.section(
            sectionTitle(subjectPrefix, "Body / Physique"),
            "Manually pin any characteristic, or leave unselected to randomize it",
            [
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random build (or pick one)", overallBuildPresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random height (or pick one)", heightPresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random chest (or pick one)", chestPresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random hips (or pick one)", hipPresets)),
                this.menu(NONE_SELECTED, presetLabels(bodyShapePresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random legs (or pick one)", legPresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random ass size (or pick one)", assSizePresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random belly size (or pick one)", bellySizePresets)),
                this.menu(NONE_SELECTED, presetLabels(specificBodyPresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random lips (or pick one)", lipsPresets)),
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random eyelashes (or pick one)", eyelashPresets)),
                this.textField("", "Custom body details (always included)", false, 60)
            ]
        ));

        addGroupedSections.call(this, fields, sectionTitle(subjectPrefix, "Appearance"), appearanceSwitchGroups);

        fields.push(this.section(
            sectionTitle(subjectPrefix, "Hair"),
            "Pick hair color/length manually, or leave unselected to randomize. Custom text is always included.",
            [
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random hair length (or pick one)", hairLengthPresets)),
                this.textField("", "Custom hair length (always included)", false, 40),
                this.textField("", "Custom hairstyle (always included)", false, 40),
                this.textField("", "Additional subject details (always included)", false, 60)
            ]
        ));

        addGroupedSections.call(this, fields, sectionTitle(subjectPrefix, "Hair"), hairstyleGroups);
        addGroupedSections.call(this, fields, sectionTitle(subjectPrefix, "Accessories"), accessoryGroups);
    }

    // -----------------------------------------
    // OUTFITS
    // -----------------------------------------
    for (let i = 0; i < outfitCount; i++) {
        const outfitPrefix = `❖  OUTFIT ${i + 1}`;

        fields.push(this.section(
            sectionTitle(outfitPrefix, "Preset"),
            "Pick a preset or enter custom text, or leave both empty to randomize clothing from all categories",
            [
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random outfit (or pick one)", clothingPresets)),
                this.textField("", "Custom outfit description (always included)", false, 60)
            ]
        ));

        addGroupedSections.call(this, fields, outfitPrefix, clothingGroups);
    }

    // -----------------------------------------
    // ACTIONS / POSES
    // -----------------------------------------
    for (let i = 0; i < actionCount; i++) {
        const actionPrefix = `❖  ACTION / POSE ${i + 1}`;

        fields.push(this.section(
            sectionTitle(actionPrefix, "Preset"),
            "Pick a pose preset or enter custom text, or leave both empty to randomize the pose from all categories",
            [
                this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random pose preset (or pick one)", complexActionPresets)),
                this.textField("", "Custom action / pose modifier (always included)", false, 60)
            ]
        ));

        addGroupedSections.call(this, fields, actionPrefix, actionGroups);
    }

    // -----------------------------------------
    // LIGHTING
    // -----------------------------------------
        fields.push(this.section(
            "❖  LIGHTING",
            "Pick lighting manually, or leave unselected to randomize",
            [this.menu(NONE_SELECTED, menuWithPlaceholder("🎲 Random lighting (or pick one)", lightingPresets))]
        ));

    return fields;
});

// =========================================
// STEP 2 — PARSE INPUTS
// =========================================

let sectionIdx = 0;

function nextSection() {
    const value = inputs[sectionIdx++];
    if (!Array.isArray(value)) {
        throw new Error(`Input parsing sanity check failed: section ${sectionIdx - 1} was not returned as an array.`);
    }
    return value;
}

// Reads the next N sections, each a group of switches, and returns
// every selected preset value flattened into one array. Used for the
// appearance / hairstyle / accessory / clothing / action switch groups,
// which all share this exact shape.
function parseGroupedSwitches(groups) {
    const values = [];
    for (const group of groups) {
        const data = nextSection();

        if (group.type === "menu") {
            const value = selectedValueWithPlaceholder(data[0], group.presets);
            if (value) values.push(value);
            continue;
        }

        if (group.hasColorMenu) {
            const selectedColor = selectedValueWithPlaceholder(data[0], clothingColorPresets);
            const customColor = typeof data[1] === "string" ? data[1].trim() : "";
            const activeColor = customColor || selectedColor;

            const switchData = data.slice(2);
            const selectedItems = selectedSwitchValues(switchData, group.presets);

            for (const item of selectedItems) {
                values.push(applyClothingColor(item, activeColor));
            }
            continue;
        }

        values.push(...selectedSwitchValues(data, group.presets));
    }
    return values;
}

// =========================================
// GENDER SYSTEM
// =========================================

const GENDER_TERMS = {
    masculine: { subject: "he", object: "him", possessive: "his", reflexive: "himself", noun: "man" },
    feminine: { subject: "she", object: "her", possessive: "her", reflexive: "herself", noun: "woman" },
    neutral: { subject: "they", object: "them", possessive: "their", reflexive: "themselves", noun: "person" }
};

function getGenderForm(gender) {
    if (/\b(man|male)\b/i.test(gender)) return "masculine";
    if (/\b(woman|female)\b/i.test(gender)) return "feminine";
    return "neutral";
}

function replaceToken(text, token, replacement) {
    return text.replace(new RegExp(`\\{${token}\\}`, "gi"), replacement);
}

// Fills the explicit gender/pronoun tags ({subjectPronoun}, {possessive},
// etc.) used throughout the pose and action presets. This only touches
// the named template tags — it deliberately does NOT do blind word-level
// substitution of "he"/"she"/"{possessive}"/etc. across the whole prompt, since
// that risked mangling custom free-text fields and preset wording that
// happened to contain those words for unrelated reasons.
function applyGenderTerms(prompt, genderForm) {
    const forms = GENDER_TERMS[genderForm] || GENDER_TERMS.neutral;

    const tokenValues = {
        subjectPronoun: forms.subject,
        objectPronoun: forms.object,
        possessive: forms.possessive,
        reflexive: forms.reflexive,
        personNoun: forms.noun
    };

    let result = prompt;
    for (const token in tokenValues) {
        result = replaceToken(result, token, tokenValues[token]);
    }
    return result;
}

// --- Batch: image count + aspect ratios (first section of the input screen) ---
const batchData = nextSection();
const randomImageCount = IMAGE_COUNTS[batchData[0]] || 5;
const aspectSelections = batchData.slice(1, 1 + ASPECT_OPTIONS.length);

// =========================================
// SUBJECT PARSING
// =========================================

let cameraChoices = [];
let colorTreatmentText = "";
let artStyles = [];
let promptTemplate = "";

// Captured user picks (empty = randomize per image). The subject's concrete
// traits are resolved per-image in the randomization engine instead of
// being flattened here.
let randomSubjectConfig = null;

for (let i = 0; i < subjectCount; i++) {

    // --- Identity ---
    const celebrityData = nextSection();
    const celebrity = selectedValueWithPlaceholder(celebrityData[0], celebrityPresets);

    if (i === 0) {
        // --- Prompt Options & Template ---
        const templateData = nextSection();
        artStyles = Array.from({ length: artStyleCount }, (_, index) =>
            selectedValueWithPlaceholder(templateData[index], artStylePresets)
        ).filter(Boolean);
        promptTemplate = templateData[artStyleCount] || "";

        // --- Camera Options ---
        const cameraData = nextSection();
        cameraChoices = Array.from({ length: cameraCount }, (_, index) =>
            selectedValueWithPlaceholder(cameraData[index], cameraOptionsPresets)
        ).filter(Boolean);

        // --- Mood / Aesthetic / Historical Media ---
        const colorTreatmentData = nextSection();
        colorTreatmentText = selectedValueWithPlaceholder(colorTreatmentData[0], colorTreatmentPresets);
    }

    const identityData = nextSection();
    const gender = selectedValueWithPlaceholder(identityData[0], genderPresets);
    const nationality = selectedValueWithPlaceholder(identityData[1], nationalityPresets);
    // Index 0 = randomize; any other index maps to a preset.
    const age = selectedValueWithPlaceholder(identityData[2], agePresets);

    // --- Body / Physique ---
    const bodyData = nextSection();

    const pinnedBuild = selectedValueWithPlaceholder(bodyData[0], overallBuildPresets);
    const pinnedHeight = selectedValueWithPlaceholder(bodyData[1], heightPresets);
    const pinnedChest = selectedValueWithPlaceholder(bodyData[2], chestPresets);
    const pinnedHips = selectedValueWithPlaceholder(bodyData[3], hipPresets);
    const pinnedBodyShape = selectedValueNoPlaceholder(bodyData[4], bodyShapePresets);
    const pinnedLegs = selectedValueWithPlaceholder(bodyData[5], legPresets);
    const pinnedAssSize = selectedValueWithPlaceholder(bodyData[6], assSizePresets);
    const pinnedBellySize = selectedValueWithPlaceholder(bodyData[7], bellySizePresets);
    const pinnedSpecificBody = selectedValueNoPlaceholder(bodyData[8], specificBodyPresets);
    const pinnedLips = selectedValueWithPlaceholder(bodyData[9], lipsPresets);
    const pinnedEyelashes = selectedValueWithPlaceholder(bodyData[10], eyelashPresets);
    const customBodyDetails = typeof bodyData[11] === "string" ? bodyData[11].trim() : "";

    // --- Appearance switch groups ---
    const appearanceValues = parseGroupedSwitches(appearanceSwitchGroups);

    // --- Hair ---
    const hairData = nextSection();
    let hairIdx = 0;
    const hairLengthIndex = hairData[hairIdx++];
    const customHairLength = typeof hairData[hairIdx++] === "string" ? hairData[hairIdx - 1].trim() : "";
    const pinnedHairLength = selectedValueWithPlaceholder(hairLengthIndex, hairLengthPresets);

    const customHairstyle = typeof hairData[hairIdx++] === "string" ? hairData[hairIdx - 1].trim() : "";
    const additionalDetails = typeof hairData[hairIdx++] === "string" ? hairData[hairIdx - 1].trim() : "";
    const hairstyleValues = parseGroupedSwitches(hairstyleGroups);

    // --- Accessories ---
    const accessoryValues = parseGroupedSwitches(accessoryGroups);

    randomSubjectConfig = {
        celebrity, gender, nationality, age,
        pinnedBuild, pinnedHeight, pinnedChest, pinnedHips, pinnedBodyShape,
        pinnedLegs, pinnedAssSize, pinnedBellySize, pinnedSpecificBody,
        pinnedLips, pinnedEyelashes, customBodyDetails,
        appearanceValues,
        pinnedHairLength, customHairLength,
        customHairstyle, hairstyleValues,
        additionalDetails, accessoryValues
    };
    break;
}

// =========================================
// OUTFIT PARSING
// =========================================

let randomOutfitConfig = null;

for (let i = 0; i < outfitCount; i++) {
    const outfitMetaData = nextSection();
    const selectedOutfit = selectedValueWithPlaceholder(outfitMetaData[0], clothingPresets);
    const customOutfit = typeof outfitMetaData[1] === "string" ? outfitMetaData[1].trim() : "";
    const clothingGroupValues = parseGroupedSwitches(clothingGroups);

    randomOutfitConfig = { selectedOutfit, customOutfit, clothingGroupValues };
    break;
}

// =========================================
// ACTION PARSING
// =========================================

let randomActionConfig = null;

for (let i = 0; i < actionCount; i++) {
    const actionMetaData = nextSection();
    const selectedAction = selectedValueWithPlaceholder(actionMetaData[0], complexActionPresets);
    const customAction = typeof actionMetaData[1] === "string" ? actionMetaData[1].trim() : "";
    const actionGroupValues = parseGroupedSwitches(actionGroups);

    randomActionConfig = { selectedAction, customAction, actionGroupValues };
    break;
}

// =========================================
// LIGHTING PARSING
// =========================================

const lightingData = nextSection();
const lighting = selectedValueWithPlaceholder(lightingData[0], lightingPresets);

// =========================================
// CALCULATE DIMENSIONS
// =========================================


// =========================================
// PROMPT HELPERS
// =========================================

function fillTemplate(template, values) {
    let result = template;
    for (const key in values) {
        result = result.replace(new RegExp(`\\{${key}\\}`, "gi"), values[key] || "");
    }
    return result;
}

function cleanPrompt(prompt) {
    return prompt
        .replace(/,\s*,/g, ",")
        .replace(/\.\s*,/g, ".")
        .replace(/^\s*,\s*/g, "")
        .replace(/\s*,\s*$/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();
}

function ensureTextContent(value, fallback) {
    const cleaned = typeof value === "string" ? cleanPrompt(value) : "";
    return cleaned || fallback;
}


// =========================================
// RANDOMIZATION ENGINE AND PROMPT CONSTRUCTION
// =========================================
// Pinned values always win; unselected traits reroll per image.
function choose(pinned, presets, enabled = true) {
    return pinned || (enabled ? randomPresetValue(presets) : "");
}
// Resolve a nationality label for trait-compatibility filtering. Pinned
// nationalities are stored as full preset values; the random path stores
// labels. Returns "" when the nationality is unknown.
// Like choose(), but when no pinned value is given it picks from the
// nationality-compatible subset for `category` ("eyes" | "hair" |
// "hairTypes" | "skin") instead of the full preset list. Falls back to the
// full list when the nationality is unknown or has no entry.
function oneRandomStyle() {
    const groups = hairstyleGroups.flatMap(group => group.presets);
    return randomPresetValue(groups);
}
function buildRandomSubject(cfg) {
    const celebrity = cfg.celebrity;
    // Celebrity presets often contain their own age, hair and identity.
    // Never randomly inject competing descriptions into those presets.
    const randomIdentity = !celebrity;
    const gender = cfg.gender || (randomIdentity ? randomPresetValue(genderPresets) : "woman");
    const genderForm = getGenderForm(gender || "woman");
    // v18: the nationality preset value is a complete concise appearance
    // description (skin, eyes, hair) -- no separate trait rolls.
    const nationality = cfg.nationality || (randomIdentity
        ? getPresetValue(randomElement(nationalityPresets)) : "");
    const age = choose(cfg.age, agePresets, randomIdentity);
    const lead = joinParts([nationality, gender]);
    const details = [age, celebrity];
    const bodyFields = [
        [cfg.pinnedBuild, overallBuildPresets], [cfg.pinnedHeight, heightPresets],
        [cfg.pinnedChest, chestPresets], [cfg.pinnedHips, hipPresets],
        [cfg.pinnedBodyShape, bodyShapePresets], [cfg.pinnedLegs, legPresets],
        [cfg.pinnedAssSize, assSizePresets], [cfg.pinnedBellySize, bellySizePresets],
        [cfg.pinnedSpecificBody, specificBodyPresets], [cfg.pinnedLips, lipsPresets],
        [cfg.pinnedEyelashes, eyelashPresets]
    ];
    // Keep unselected body proportions unspecified rather than stacking
    // conflicting shapes (petite + tall + very large, etc.).
    for (const [value] of bodyFields) if (value) details.push(value);
    if (!celebrity && !cfg.pinnedBuild && !cfg.pinnedBodyShape) details.push(randomPresetValue(overallBuildPresets));
    details.push(cfg.customBodyDetails, ...cfg.appearanceValues);
    const hasPinnedHair = Boolean(cfg.customHairstyle || cfg.hairstyleValues.length);
    const hairLength = choose(cfg.customHairLength || cfg.pinnedHairLength, hairLengthPresets, !celebrity && !hasPinnedHair);
    const style = joinParts([...cfg.hairstyleValues, cfg.customHairstyle || (!celebrity && !hasPinnedHair && !cfg.pinnedHairLength && !cfg.customHairLength ? oneRandomStyle() : "")]);
    details.push(joinParts([hairLength, style]));
    details.push(cfg.additionalDetails, ...cfg.accessoryValues);
    const subjectDetails = joinParts(details);
    return {
        subject: joinParts([lead, subjectDetails]), subjectLead: lead, subjectDetails,
        gender, nationality, genderForm
    };
}

// A selected complete outfit is authoritative. Otherwise choose ONE
// coherent clothing category (or a top + bottom), not every category.
function buildRandomOutfit(cfg) {
    const fixed = joinParts([cfg.selectedOutfit, cfg.customOutfit, ...cfg.clothingGroupValues]);
    if (fixed) return fixed;
    const main = clothingGroups.filter(group => !["Footwear", "Costume Oddities"].includes(group.title));
    const group = randomElement(main);
    if (group.title === "Tops") {
        return joinParts([randomPresetValue(group.presets), randomPresetValue(clothingGroups.find(g => g.title === "Bottoms").presets)]);
    }
    if (group.title === "Bottoms") {
        return joinParts([randomPresetValue(clothingGroups.find(g => g.title === "Tops").presets), randomPresetValue(group.presets)]);
    }
    return randomPresetValue(group.presets);
}

// =========================================
// TAG-BASED COMPATIBILITY (cf. Prompt Randomizer v1)
// Presets carry `tags`; random generation filters dependent categories
// by tag overlap instead of hardcoded text heuristics.
// =========================================
// Tags on a preset object; plain-string presets have none.
function presetTags(preset) {
    return (preset && typeof preset === "object" && Array.isArray(preset.tags)) ? preset.tags : [];
}
function hasPresetTag(preset, tag) {
    return presetTags(preset).includes(tag);
}
// Random preset OBJECT (not just its value), skipping empty values.
function randomPreset(presets) {
    const candidates = presets.filter(p => {
        const value = getPresetValue(p);
        return value !== undefined && value !== null && value !== "";
    });
    return candidates.length > 0 ? randomElement(candidates) : null;
}

// Indoor/outdoor environment tags of the most recently built random
// action. Read when randomizing lighting (see buildRandomAction).
let lastActionEnvTags = [];

// Random lighting preset whose tags match the last built action's
// environment. Falls back to the full list when the context is unknown.
function randomCompatibleLighting() {
    const wantIndoor = lastActionEnvTags.includes("indoor");
    const wantOutdoor = lastActionEnvTags.includes("outdoor");
    const pool = lightingPresets.filter(p => {
        if (wantIndoor) return hasPresetTag(p, "indoor");
        if (wantOutdoor) return hasPresetTag(p, "outdoor");
        return true;
    });
    return randomPresetValue(pool.length ? pool : lightingPresets);
}

// Never randomly select the explicit Sexual Positions menu or pile
// several mutually exclusive base positions into a single prompt.
function buildRandomAction(cfg) {
    const fixed = joinParts([cfg.selectedAction, cfg.customAction, ...cfg.actionGroupValues]);
    if (fixed) return fixed;
    // Tag-driven compatibility: the position (or a complex pose) is picked
    // first; a setting is added unless the position carries its own
    // location; flavor is filtered by pose tags; the environment tags are
    // remembered for lighting. The explicit Sexual Positions group stays
    // out of random rotation.
    const groupByTitle = title => actionGroups.find(g => g.title === title);
    const parts = [];
    const positionPreset = (Math.random() < 0.3 && complexActionPresets.length)
        ? randomPreset(complexActionPresets)
        : randomPreset(groupByTitle("Position").presets);
    const positionTags = presetTags(positionPreset);
    if (positionPreset) parts.push(getPresetValue(positionPreset));

    // Setting, unless the position already names a location.
    let envTags = [];
    if (!positionTags.includes("location") && Math.random() < 0.7) {
        const settingPreset = randomPreset(groupByTitle("Setting").presets);
        if (settingPreset) {
            parts.push(getPresetValue(settingPreset));
            envTags = presetTags(settingPreset);
        }
    }
    if (envTags.length === 0) {
        envTags = positionTags.filter(tag => tag === "indoor" || tag === "outdoor");
    }
    lastActionEnvTags = envTags;

    // Flavor, filtered by pose tags: load-bearing poses skip the Arms
    // group entirely; horizontal poses skip upright-only flavor.
    if (Math.random() < 0.5) {
        const flavorGroups = ["Gaze", "Expression", "Arms", "Legs"];
        if (positionTags.includes("handsBusy")) {
            flavorGroups.splice(flavorGroups.indexOf("Arms"), 1);
        }
        for (let attempt = 0; attempt < 4; attempt++) {
            const flavorPreset = randomPreset(groupByTitle(randomElement(flavorGroups)).presets);
            if (!flavorPreset) continue;
            if (positionTags.includes("floor") && hasPresetTag(flavorPreset, "upright")) continue;
            parts.push(getPresetValue(flavorPreset));
            break;
        }
    }
    return joinParts(parts);
}

function makePrompt(data, aspectOption) {
    const values = {
        descriptor: joinParts([colorTreatmentText, data.camera]),
        artStyle: data.artStyle, camera: data.camera,
        subject: data.subject.subject, subjects: data.subject.subject,
        gender: data.subject.gender, nationality: data.subject.nationality,
        subjectLead: data.subject.subjectLead,
        description: data.subject.subjectDetails,
        subjectDetails: data.subject.subjectDetails,
        clothing: data.outfit, action: data.action,
        timeOfDay: "", lighting: data.lighting,
        colorTreatment: colorTreatmentText
    };
    let prompt = cleanPrompt(applyGenderTerms(fillTemplate(promptTemplate, values), data.subject.genderForm));
    if (!prompt) prompt = DEFAULT_PROMPT_FALLBACKS.genericPrompt;
    return { prompt, width: aspectOption.width, height: aspectOption.height, aspectLabel: aspectOption.label };
}

const selectedAspectOptions = getSelectedAspectOptions(aspectSelections);
const finalPrompts = [];

for (let i = 0; i < randomImageCount; i++) {
    const subject = buildRandomSubject(randomSubjectConfig);
    const aspectOption = randomElement(selectedAspectOptions);
    // Build the action first -- it records its environment tags
    // (lastActionEnvTags) for compatible lighting below.
    const actionText = buildRandomAction(randomActionConfig);
    finalPrompts.push(makePrompt({
        subject,
        outfit: buildRandomOutfit(randomOutfitConfig),
        action: actionText,
        camera: cameraChoices.length ? randomElement(cameraChoices) : randomPresetValue(cameraOptionsPresets),
        artStyle: artStyles.length ? randomElement(artStyles) : randomPresetValue(artStylePresets),
        lighting: lighting || randomCompatibleLighting()
    }, aspectOption));
}

// =========================================
// STEP 3 — REVIEW / PREVIEW SCREEN
// =========================================
// Shows the total prompt count and a sample of the final prompt strings
// (enhanced when the enhancer is enabled) before anything is generated,
// so template mistakes or unexpected combinations are visible up front
// instead of only showing up in the console log after generation has
// already started.

function buildPreviewText(prompts) {
    const sample = prompts.slice(0, PREVIEW_SAMPLE_SIZE);
    const numbered = sample.map((promptData, index) => `${index + 1}. [${promptData.aspectLabel}] ${promptData.prompt}`);

    if (prompts.length > sample.length) {
        numbered.push(`… and ${prompts.length - sample.length} more prompt(s) not shown here.`);
    }

    return numbered.join("\n\n");
}

async function runBatch() {

    const review = requestFromUser("Review Prompts", "Generate", function () {
        const aspectSummary = "random aspect ratios";
        const modelSummary = KREA_MODEL.label;
        const totalImages = finalPrompts.length;
        const modeSummary = `${totalImages} image(s). Anything not selected was randomized per image.`;

        return [
            this.section(
                "❖  Batch Summary",
                `${modeSummary} Rendering on ${modelSummary} at ${aspectSummary}.`,
                [this.switch(true, `Confirm and generate all ${totalImages} image(s)`)]
            ),

            this.section(
                "❖  Sample Prompts",
                finalPrompts.length > PREVIEW_SAMPLE_SIZE
                    ? `Showing the first ${PREVIEW_SAMPLE_SIZE} of ${finalPrompts.length} constructed prompts`
                    : "The full set of constructed prompts",
                [this.textField(buildPreviewText(finalPrompts), "Constructed prompt preview (read-only)", true, 4000)]
            )
        ];
    });

    const confirmed = review[0][0] === true;

    if (!confirmed) {
        console.log("Batch generation cancelled by user on the review screen.");
        return;
    }

    const baseConfig = JSON.parse(JSON.stringify(pipeline.configuration));

    baseConfig.batchCount = 1;
    baseConfig.batchSize = 1;
    baseConfig.seed = -1;

    canvas.clear();

    for (const promptData of finalPrompts) {
        const config = JSON.parse(JSON.stringify(baseConfig));

        config.model = KREA_MODEL.file;
        config.loras = KREA_MODEL.loras.map(lora => ({ ...lora }));
        config.width = promptData.width;
        config.height = promptData.height;

        canvas.clear();

        console.log(`Generating ${promptData.aspectLabel} prompt with Krea 2:`, promptData.prompt);
        await pipeline.run({ configuration: config, prompt: promptData.prompt });
    }
}

runBatch();