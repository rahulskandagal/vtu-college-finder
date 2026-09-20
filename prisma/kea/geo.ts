/**
 * Karnataka place-name → (city, district) lookup used to locate colleges from
 * the free-text names/addresses in KEA documents. Keywords are matched
 * case-insensitively; the match that appears LAST in the text wins (KEA puts
 * the town/district at the end).
 */
export type Place = { city: string; district: string };

const P = (keywords: string[], city: string, district: string): [string[], Place] => [keywords, { city, district }];

export const PLACES: [string[], Place][] = [
  // Bengaluru Urban
  P(["bengaluru", "bangalore", "banglore", "yelahanka", "electronic city", "electronics city", "whitefield", "kengeri", "hesaraghatta", "jalahalli", "rajarajeshwari", "anekal", "chagalatti", "hennur", "begur", "doddakammanahall", "hunasamaranahalli", "hunsamaranahalli", "bidadi", "ban'lore", "b'lore", "bengalore", "banagalore", "kanakapura road", "bannerghatta", "bannerugatta", "k r puram", "kr puram", "basavanagudi", "mallathahalli", "kammanahalli", "kothnur", "bidadi", "kadugodi", "chikkabanavara", "kumbalgodu", "kumbalagodu", "attibele", "sarjapur", "hosur road", "hoskote", "soldevanahalli", "gottigere", "peenya", "vidyanagar", "mahalakshmipuram", "uttarahalli", "jigani", "tavarekere", "bilekahalli", "mysore road", "magadi road"], "Bengaluru", "Bengaluru Urban"),
  // Bengaluru Rural
  P(["devanahalli", "doddaballapur", "dodda ballapur", "nelamangala", "hosakote", "vijayapura (tq)", "channarayapatna (bengaluru)"], "Devanahalli", "Bengaluru Rural"),
  P(["ramanagara", "ramanagaram", "ramnagar", "ramanagar", "kanakapura", "magadi", "channapatna"], "Ramanagara", "Ramanagara"),
  P(["chikkaballapur", "chikballapur", "chickballapur", "chikkaballapura", "chintamani", "gauribidanur", "gowribidanur", "sidlaghatta"], "Chikkaballapur", "Chikkaballapur"),
  P(["kolar", "kgf", "k.g.f", "k g f", "bangarpet", "mulbagal"], "Kolar", "Kolar"),
  P(["tumkur", "tumakuru", "tiptur", "sira", "kunigal", "madhugiri", "gubbi"], "Tumakuru", "Tumakuru"),
  P(["mysore", "mysuru", "nanjangud", "hunsur", "manandavadi"], "Mysuru", "Mysuru"),
  P(["mandya", "maddur", "malavalli", "srirangapatna"], "Mandya", "Mandya"),
  P(["hassan", "arasikere", "arsikere", "channarayapatna", "sakleshpur"], "Hassan", "Hassan"),
  P(["chamarajanagar", "chamarajnagar", "chamaraja nagar", "chamarajanagara", "kollegal", "gundlupet"], "Chamarajanagar", "Chamarajanagar"),
  P(["kodagu", "madikeri", "coorg", "kushalnagar"], "Madikeri", "Kodagu"),
  P(["chikmagalur", "chikkamagaluru", "chikamagalur", "chikkamagalur", "kadur", "tarikere"], "Chikkamagaluru", "Chikkamagaluru"),
  P(["shimoga", "shivamogga", "bhadravathi", "bhadravati", "sagar", "shikaripura"], "Shivamogga", "Shivamogga"),
  P(["davangere", "davanagere", "harihar", "channagiri"], "Davangere", "Davangere"),
  P(["chitradurga", "hiriyur", "challakere", "holalkere"], "Chitradurga", "Chitradurga"),
  P(["mangalore", "mangaluru", "moodbidri", "moodabidri", "moodbidre", "mudabidri", "bantwal", "bantval", "puttur", "sullia", "sulya", "ullal", "surathkal", "d k dist", "dk dist", "dakshina kannada", "dakshin kannada", "kinnigoli", "benjanapadavu"], "Mangaluru", "Dakshina Kannada"),
  P(["udupi", "manipal", "nitte", "karkala", "karkal", "kundapura", "kundapur", "brahmavar"], "Udupi", "Udupi"),
  P(["karwar", "bhatkal", "bhatkala", "sirsi", "kumta", "honnavar", "uttar kannada", "uttara kannada", "u k dist", "uk dist", "dandeli", "haliyal"], "Karwar", "Uttara Kannada"),
  P(["hubli", "hubballi", "dharwad", "dharwar", "darward", "navanagar", "varur", "vidyanagar hubli"], "Hubballi", "Dharwad"),
  P(["belgaum", "belagavi", "gokak", "chikodi", "chikkodi", "athani", "bailhongal", "nippani", "nipani", "hukkeri", "hukeri", "bagewadi"], "Belagavi", "Belagavi"),
  P(["bagalkot", "bagalkote", "ilkal", "jamkhandi", "mudhol", "badami", "hungund"], "Bagalkot", "Bagalkot"),
  P(["bijapur", "vijayapura", "vijaypur", "indi", "basavana bagewadi"], "Vijayapura", "Vijayapura"),
  P(["gadag", "laxmeshwar", "lakshmeshwar", "gadag betgeri", "betageri"], "Gadag", "Gadag"),
  P(["haveri", "ranebennur", "ranibennur", "byadgi", "savanur"], "Haveri", "Haveri"),
  P(["bellary", "ballari", "sandur", "hospet", "hosapete", "toranagallu", "vidyanagar (jsw)"], "Ballari", "Ballari"),
  P(["hospet", "hosapete", "vijayanagara", "toranagallu"], "Hosapete", "Vijayanagara"),
  P(["koppal", "gangavathi", "gangavati", "kushtagi"], "Koppal", "Koppal"),
  P(["raichur", "raihcur", "sindhanur", "lingsugur", "manvi"], "Raichur", "Raichur"),
  P(["gulbarga", "kalaburagi", "kalburgi", "sedam", "aland", "chittapur", "shahabad"], "Kalaburagi", "Kalaburagi"),
  P(["yadgir", "yadgiri", "shahapur", "shorapur", "surpur"], "Yadgir", "Yadgir"),
  P(["bidar", "bhalki", "basavakalyan", "basavakalyana", "humnabad", "humanabad"], "Bidar", "Bidar"),
];

export type Match = Place & { keyword: string; index: number; text: string };

/** Find the place mentioned in a text; the match that appears last wins. */
export function locateIn(text: string): Match | null {
  const t = text.toLowerCase();
  let best: Match | null = null;
  for (const [keywords, place] of PLACES) {
    for (const kw of keywords) {
      const idx = t.lastIndexOf(kw);
      if (idx >= 0 && (!best || idx > best.index)) best = { ...place, keyword: kw, index: idx, text };
    }
  }
  return best;
}

export function locate(...texts: (string | undefined | null)[]): Place | null {
  for (const text of texts) {
    if (!text) continue;
    const m = locateIn(text);
    if (m) return { city: m.city, district: m.district };
  }
  return null;
}
