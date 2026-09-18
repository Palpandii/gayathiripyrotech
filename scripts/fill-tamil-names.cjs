// One-off script: fills name_ta for every product with a Tamil-script
// transliteration built word-by-word from a fixed dictionary, instead of
// just duplicating name_en. Run: node scripts/fill-tamil-names.cjs
const fs = require('fs')
const path = require('path')

const DICT = {
    air: 'ஏர்', ak: 'ஏகே', amazon: 'அமேசான்', android: 'ஆண்ட்ராய்டு',
    asoka: 'அசோகா', bada: 'பாதா', ball: 'பந்து', bambaram: 'பம்பரம்',
    bank: 'பேங்க்', barrel: 'பீப்பாய்', big: 'பெரிய', bijili: 'பிஜிலி',
    bird: 'பறவை', black: 'கருப்பு', blue: 'நீலம்', bobby: 'பாபி',
    bomb: 'பாம்ப்', box: 'பாக்ஸ்', bullet: 'புல்லட்', butter: 'பட்டர்',
    candy: 'காண்டி', celebration: 'கொண்டாட்டம்', chakkar: 'சக்கரம்',
    cherry: 'செர்ரி', choconz: 'சாக்கோன்ஸ்', chorsa: 'சோர்சா',
    chotta: 'சோட்டா', classic: 'கிளாசிக்', coco: 'கோகோ', colour: 'கலர்',
    combo: 'காம்போ', cone: 'கோன்', crack: 'கிராக்', crackling: 'கிராக்லிங்',
    crazy: 'கிரேசி', cristal: 'கிரிஸ்டல்', crown: 'கிரீடம்',
    cylinder: 'சிலிண்டர்', dance: 'டான்ஸ்', deluxe: 'டீலக்ஸ்',
    digital: 'டிஜிட்டல்', disco: 'டிஸ்கோ', diwali: 'தீபாவளி', dora: 'டோரா',
    double: 'டபுள்', drone: 'ட்ரோன்', drops: 'ட்ராப்ஸ்', egg: 'முட்டை',
    electric: 'எலெக்ட்ரிக்', elephant: 'யானை', face: 'முகம்', falls: 'ஃபால்ஸ்',
    family: 'குடும்பம்', fancy: 'ஃபேன்சி', feather: 'இறகு',
    flakes: 'ஃப்ளேக்ஸ்', flash: 'ஃபிளாஷ்', flower: 'ஃபிளவர்', fly: 'ஃப்ளை',
    forest: 'காடு', fountain: 'ஃபவுண்டன்', fruit: 'பழம்', ganga: 'கங்கா',
    gel: 'ஜெல்', giant: 'ஜம்பான்', gold: 'கோல்ட்', green: 'பச்சை',
    guitar: 'கிதார்', gun: 'துப்பாக்கி', hanuman: 'ஹனுமான்',
    helicopter: 'ஹெலிகாப்டர்', humpty: 'ஹம்ப்டி', hydro: 'ஹைட்ரோ',
    ipl: 'ஐபிஎல்', items: 'பொருட்கள்', jack: 'ஜாக்', jamuna: 'யமுனா',
    jewels: 'நகைகள்', jolly: 'ஜாலி', kadayutham: 'கடையுத்தம்', kg: 'கிலோ',
    kid: 'குழந்தை', king: 'ராஜா', koti: 'கோடி', kotti: 'கோட்டி',
    kulffi: 'குல்பி', kuruvi: 'குருவி', label: 'லேபிள்', lakshmi: 'லட்சுமி',
    lava: 'லாவா', lion: 'சிங்கம்', loco: 'லோகோ', lunik: 'லூனிக்',
    magical: 'மேஜிக்கல்', man: 'மேன்', mataram: 'மாதரம்', mega: 'மெகா',
    melody: 'மெலடி', mercury: 'மெர்குரி', mix: 'மிக்ஸ்', moank: 'மோங்க்',
    mocktail: 'மாக்டெயில்', money: 'பணம்', monkey: 'குரங்கு', multi: 'மல்டி',
    multicolour: 'பல்வண்ணம்', music: 'இசை', musical: 'இசை', mutt: 'மட்',
    nayagara: 'நயாகரா', night: 'இரவு', old: 'பழைய', olympus: 'ஆலிம்பஸ்',
    one: 'ஒன்று', out: 'அவுட்', pack: 'பேக்', palm: 'பாம்', panda: 'பாண்டா',
    peacock: 'மயில்', penta: 'பென்டா', photo: 'புகைப்படம்', poco: 'போகோ',
    pop: 'பாப்', poseidon: 'போஸிடான்', pots: 'பாட்ஸ்', putt: 'புட்',
    robo: 'ரோபோ', red: 'சிவப்பு', redo: 'ரீடூ', rex: 'ரெக்ஸ்',
    rider: 'ரைடர்', ring: 'ரிங்', rock: 'ராக்', rocket: 'ராக்கெட்',
    scooby: 'ஸ்கூபி', selfie: 'செல்ஃபி', set: 'செட்', shot: 'ஷாட்',
    shower: 'மழை', showering: 'மழைபொழிதல்', silver: 'சில்வர்',
    singing: 'பாடும்', single: 'தனி', siren: 'சைரன்', sizzling: 'சிஸ்லிங்',
    small: 'சின்ன', smoke: 'புகை', snow: 'பனி', sound: 'சத்தம்',
    sparklers: 'மத்தாப்பு', special: 'ஸ்பெஷல்', spider: 'சிலந்தி',
    spinner: 'ஸ்பின்னர்', star: 'நட்சத்திரம்', stick: 'குச்சி',
    stripped: 'கோடு', super: 'சூப்பர்', thala: 'தலா', tin: 'டின்',
    tom: 'டாம்', too: 'டூ', top: 'டாப்', tower: 'கோபுரம்', tree: 'மரம்',
    tri: 'ட்ரை', tricolour: 'மூவர்ணம்', trident: 'திரிசூலம்',
    tumpty: 'டம்ப்டி', twin: 'இரட்டை', twinkling: 'மின்னும்', two: 'இரண்டு',
    udumban: 'உடும்பான்', ultra: 'அல்ட்ரா', undo: 'அன்டூ', vip: 'விஐபி',
    vande: 'வந்தே', vanila: 'வெனிலா', vibes: 'வைப்ஸ்', watts: 'வாட்ஸ்',
    wheel: 'சக்கரம்', wheeling: 'வீலிங்', whistling: 'விசில்',
    window: 'ஜன்னல்', wire: 'வயர்', and: 'மற்றும்', of: 'இன்',
}

function transliterate(nameEn) {
    return nameEn.replace(/[A-Za-z]+/g, (word) => {
        const key = word.toLowerCase()
        if (Object.prototype.hasOwnProperty.call(DICT, key)) {
            return DICT[key]
        }
        return word // unknown word (brand code, model name) stays in English
    })
}

const file = path.join(__dirname, '..', 'src', 'data', 'products.js')
let src = fs.readFileSync(file, 'utf8')

src = src.replace(
    /("name_en":\s*")((?:[^"\\]|\\.)*)("[\s\S]*?"name_ta":\s*")((?:[^"\\]|\\.)*)(")/g,
    (match, p1, nameEnRaw, p3, _oldTa, p5) => {
        const nameEn = nameEnRaw.replace(/\\"/g, '"')
        const nameTa = transliterate(nameEn).replace(/"/g, '\\"')
        return `${p1}${nameEnRaw}${p3}${nameTa}${p5}`
    }
)

fs.writeFileSync(file, src)
console.log('name_ta fields updated for all products.')