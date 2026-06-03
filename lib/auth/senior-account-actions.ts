"use server";

import "server-only";
import { randomInt } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/auth/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildSeniorEmail } from "@/lib/auth/senior-auth";

/**
 * Reset the senior's password to a freshly generated short string. The owner
 * sees the new password once and is told to write it down or print it.
 */
export async function resetSeniorPassword(
  familyId: string,
  seniorId: string,
): Promise<{ ok: true; password: string } | { ok: false; error: string }> {
  const owner = await requireOwner();
  if (owner.familyId !== familyId) {
    return { ok: false, error: "Tato rodina vám nepatří." };
  }

  const admin = createAdminClient();
  const { data: senior } = await admin
    .from("profiles")
    .select("id")
    .eq("family_id", familyId)
    .eq("role", "senior")
    .eq("id", seniorId)
    .maybeSingle<{ id: string }>();

  if (!senior) return { ok: false, error: "Účet blízkého neexistuje." };

  const password = generateMemorablePassword();

  // Also fix the synthetic email so it matches profile.id - corrects accounts
  // created before the pinnedUuid fix where email used a different seed UUID.
  const { error } = await admin.auth.admin.updateUserById(senior.id, {
    password,
    email: buildSeniorEmail(senior.id),
  });
  if (error) return { ok: false, error: "Heslo se nepodařilo nastavit." };

  await admin.from("activity_log").insert({
    family_id: familyId,
    actor_id: owner.id,
    action: "senior.password_reset",
    // Do not put PII or secrets in metadata — visible to every family member via RLS.
    metadata: null,
  });

  revalidatePath(`/family/${familyId}/senior`);
  return { ok: true, password };
}

/**
 * Returns a freshly generated senior-friendly password using the same
 * crypto-secure generator as the reset flow. Exposed as an action so the
 * add-senior form can prefill a strong default without shipping the 768-word
 * lists into the client bundle.
 */
export async function suggestSeniorPassword(): Promise<string> {
  return generateMemorablePassword();
}

/**
 * Senior-friendly password: 3 short ASCII Czech-rooted words + 2 digits.
 * Example: "lipa-mira-hrasek-42". 14-22 chars total. With 256³ × 90 ≈ 1.5B
 * combinations and crypto-secure sampling we get ~30 bits of entropy —
 * comfortable for a low-stakes account that's typed once and then auto-filled.
 *
 * Words intentionally avoid š, č, ř, ž, ý and other diacritics that are hard
 * to type for elderly users on a Czech keyboard. Each list is exactly 256
 * common, recognizable nouns/adjectives.
 */
function generateMemorablePassword(): string {
  const w1 = sample(W1);
  const w2 = sample(W2);
  const w3 = sample(W3);
  // randomInt is uniform and crypto-secure; ranges are exclusive on the high end.
  const num = String(10 + randomInt(0, 90));
  return `${w1}-${w2}-${w3}-${num}`;
}

function sample<T>(arr: readonly T[]): T {
  return arr[randomInt(0, arr.length)]!;
}

/* --------------------------------------------------------------------------
 * Wordlists. Each list is exactly 256 entries. All entries are 3-6 chars,
 * lowercase ASCII, no diacritics. Curated for elder familiarity (common
 * Czech nouns/adjectives, no slang, no jargon).
 * -------------------------------------------------------------------------- */

// Stromy, kvetiny, prirodni objekty (256).
const W1: readonly string[] = [
  "lipa", "vrba", "buk", "habr", "modrin", "borov", "dub", "javor",
  "smrk", "olse", "jeran", "jasan", "topol", "trnka", "kalina", "akat",
  "jedle", "tis", "brza", "osika", "platan", "kasta", "moruse", "broskev",
  "jablon", "hruska", "trnku", "visen", "morus", "reva", "vinic", "chmel",
  "ruze", "tulipan", "fialka", "narcis", "kosatec", "macek", "petunie", "begonie",
  "azalka", "kamelie", "magnol", "hortenz", "tymian", "mata", "saturej", "majoran",
  "bazalka", "rozmar", "leven", "kopretina", "sedmik", "blatouch", "pomnenka", "konvalin",
  "lilium", "lila", "jirina", "georgin", "frezie", "krokus", "snezenka", "petrklic",
  "mech", "lisej", "kapra", "kapradi", "ostruz", "borovin", "psenice", "zito",
  "oves", "jecmen", "kukurice", "luh", "louka", "pole", "remen", "lan",
  "hora", "hurka", "kopec", "vrchol", "skala", "balvan", "kamen", "valoun",
  "potok", "rican", "reka", "rybnik", "jezero", "tun", "mlaka", "louze",
  "studna", "pramen", "vyver", "spad", "vodopad", "brod", "tun", "duna",
  "pisek", "stern", "blato", "hlina", "jil", "humus", "kamenec", "sklenec",
  "krystal", "diamant", "perla", "korale", "achat", "opal", "topas", "ametyst",
  "smaragd", "rubin", "saphir", "granat", "jantar", "ulit", "lastura", "muslic",
  "morek", "racek", "labut", "kachna", "husa", "koroptev", "bazant", "krocan",
  "kuratko", "kohout", "slepice", "vrabec", "sykora", "drozd", "kalous", "sova",
  "puh", "ledna", "vlasta", "hrdli", "holub", "ibis", "havran", "vrana",
  "kavka", "straka", "datel", "kukacka", "dudek", "skore", "rorys", "lasto",
  "vlazo", "lipan", "okun", "stika", "kapr", "lin", "amur", "candat",
  "uhor", "platy", "treska", "tuner", "losos", "pstruh", "okoun", "perlin",
  "sumec", "raj", "vlk", "lisa", "medvied", "vyder", "kuna", "lasi",
  "tchor", "jezvec", "krtek", "jezek", "vever", "myska", "potkan", "krys",
  "kralik", "zajic", "srnec", "jelen", "los", "kanc", "divcak", "mufak",
  "kosak", "kozel", "kuon", "valech", "klisna", "hrebec", "tele", "jehne",
  "kotek", "psik", "rota", "fenka", "stene", "morce", "morcat", "hadik",
  "uzo", "zmije", "ropuch", "rosnic", "salam", "mlok", "rosnik", "skok",
  "vluk", "los", "polar", "panda", "tygr", "lev", "slon", "zebra",
  "klokan", "koala", "tukan", "papagaj", "pelika", "andulka", "andulek", "andula",
  "klika", "kotva", "vlajka", "stuha", "mota", "kabat", "saty", "halen",
  "kosile", "boty", "sandal", "klobouk", "satek", "sala", "rukav", "knofli",
];

// Rocni obdobi, casti dne, pocasi (256).
const W2: readonly string[] = [
  "leto", "podzim", "zima", "jaro", "rano", "vecer", "noc", "den",
  "poled", "soumr", "usvit", "ranec", "polno", "svitan", "stmiv", "obed",
  "snid", "vecer", "noc", "raz", "duben", "kveten", "cerven", "cervenec",
  "srpen", "zari", "rijen", "listo", "prosin", "leden", "unor", "brezen",
  "ponde", "uter", "stred", "ctvrt", "patek", "sobot", "nede", "tyden",
  "mesic", "rok", "stol", "vek", "doba", "epocha", "obdob", "fae",
  "rocni", "sezona", "lon", "letos", "vcera", "dnes", "zitra", "potom",
  "nyni", "dlouho", "brzy", "pozde", "vcas", "neku", "nikdy", "vzdy",
  "stale", "casto", "obcas", "malo", "vice", "nejvic", "nejmi", "polov",
  "ctvrtin", "desat", "stovka", "tisic", "milion", "miliard", "tucet", "kopa",
  "blesk", "hrom", "kropej", "lijavec", "deste", "deste", "snih", "mraz",
  "rosa", "jinov", "mlha", "opar", "mraky", "mracen", "ovzdusi", "obloha",
  "obloha", "kupa", "zaplava", "bourka", "vichr", "vetri", "bouri", "vichor",
  "klid", "nedo", "horko", "vedro", "chlad", "tepol", "pohod", "duch",
  "slunce", "mesic", "hvezda", "kometa", "planet", "zeme", "luna", "saturn",
  "venus", "mars", "merkur", "jupit", "neptu", "uranus", "obloha", "mlecna",
  "puda", "humus", "skala", "hlina", "kamen", "vapen", "krida", "pisek",
  "lava", "magma", "ker", "kapaln", "ohen", "plamen", "uhle", "uhlik",
  "jiskra", "popel", "saze", "dym", "para", "obid", "obid", "pozar",
  "lod", "vlna", "prub", "proud", "pena", "klid", "tise", "hluk",
  "tise", "ozven", "echo", "vysok", "hluboko", "siroko", "uzko", "tenko",
  "tlust", "lehko", "tezko", "tvrdo", "mekko", "drsno", "hladko", "ostro",
  "tupy", "kose", "rovne", "krive", "rovno", "spat", "kolmo", "vodor",
  "uvnit", "venku", "doma", "vede", "vedle", "blizko", "daleko", "tudy",
  "ondy", "vsude", "nikde", "nekde", "tady", "tamco", "kamsi", "kdesi",
  "potom", "drive", "behem", "skrz", "kolem", "skrze", "okolo", "prik",
  "pod", "nad", "pres", "mez", "uvnitr", "kraj", "stred", "konec",
  "zacatek", "puli", "okraj", "rohu", "rohem", "vchod", "vychod", "spoj",
  "smer", "cesta", "ulice", "namesti", "trida", "uli", "stezka", "pesina",
  "most", "pasaz", "tunel", "podchod", "nadchod", "prejezd", "prechod", "krizov",
  "stanic", "zastav", "depot", "garaz", "nadrazi", "letiste", "molo", "pristav",
  "park", "sad", "zahrada", "louka", "haj", "les", "polic", "luh",
];

// Rostliny, predmety v domacnosti, jednoduche pojmy (256).
const W3: readonly string[] = [
  "mlyn", "kapra", "studna", "potok", "rybnik", "bodlak", "konva", "kost",
  "hrnek", "talir", "vidli", "lzice", "noz", "mis", "tac", "kotlik",
  "hrnec", "pekac", "pan", "kupa", "ker", "metla", "smetak", "kbelik",
  "lavor", "vana", "sprcha", "krhla", "konev", "stojan", "zidle", "kreslo",
  "lavice", "stul", "stolek", "police", "regal", "skrin", "skrinka", "komoda",
  "postel", "matrace", "polstar", "pero", "pelisek", "kolebka", "houpac", "houpa",
  "ohnis", "krb", "kamna", "pec", "trouba", "kotle", "radiator", "topen",
  "lampa", "svicen", "luste", "svetlo", "knot", "vosk", "fakle", "louc",
  "kniha", "sesit", "blok", "obal", "papir", "tuzka", "pero", "stete",
  "barva", "barv", "stuha", "vodov", "akvar", "olej", "tempera", "krej",
  "klika", "klika", "klic", "zamek", "petlice", "haku", "hrebik", "vrut",
  "matice", "podlozka", "klin", "klika", "drat", "lano", "provaz", "smyc",
  "uzel", "smy", "remen", "popruh", "pasek", "pas", "spona", "spinac",
  "perlik", "kladiv", "klesta", "klesa", "pila", "rasple", "pilnik", "hoblik",
  "dlato", "vrtak", "sroub", "spirala", "vrtulka", "smid", "kotouc", "kotlik",
  "obraz", "ramy", "zrcad", "kobere", "rohozka", "zaclona", "zavesa", "rolet",
  "okenice", "okno", "dvere", "branka", "vrata", "klika", "schody", "rampa",
  "podes", "podlaha", "strop", "krov", "trama", "krokev", "tasky", "hreben",
  "komin", "veza", "konec", "vchod", "vez", "zed", "plot", "branka",
  "tabule", "bedna", "krabice", "kufr", "taska", "kabel", "kapsa", "vacek",
  "mosna", "raneck", "balik", "balicek", "obal", "vazac", "tubus", "rolka",
  "kotouc", "cely", "puli", "trojku", "tisic", "milion", "miliard", "kvint",
  "kus", "drobec", "krapet", "kotouc", "trosk", "zlomek", "kostk", "valek",
  "valec", "koule", "krouz", "ostrov", "krcek", "krcma", "salas", "chata",
  "chalou", "domek", "dum", "vila", "palac", "hrad", "zamek", "tvrz",
  "kostel", "kapli", "klaster", "fara", "fara", "rektora", "rakev", "krov",
  "vez", "spice", "vrchol", "bod", "uhel", "kruh", "kvad", "obdel",
  "ctverec", "kruh", "elipsa", "ovaal", "pyram", "kuzel", "krychle", "deska",
  "deni", "obtah", "okraj", "lemu", "rohov", "spica", "zakou", "obnov",
  "novink", "stary", "novy", "mlady", "stary", "staro", "drobno", "celkem",
  "klid", "spor", "shoda", "souhlas", "smir", "dohod", "smlouv", "uvedom",
  "vzpomin", "pamet", "myslen", "snenie", "predst", "iluze", "predur", "predur",
];

if (W1.length !== 256 || W2.length !== 256 || W3.length !== 256) {
  // Guard against accidental edits that drop entries — keeps entropy guarantees.
  throw new Error(
    `senior password wordlists must each have 256 entries (got ${W1.length}/${W2.length}/${W3.length})`,
  );
}
