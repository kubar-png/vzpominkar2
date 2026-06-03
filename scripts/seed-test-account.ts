/**
 * Seeds the local Supabase instance with a test owner + senior + sample memories.
 * Run: npx tsx --env-file .env.local scripts/seed-test-account.ts
 */

import { createClient } from "@supabase/supabase-js";

const OWNER_EMAIL = "kubar@centrum.cz";
const OWNER_PASSWORD = "123456";
const OWNER_DISPLAY_NAME = "Jakub";

const SENIOR_DISPLAY_NAME = "Babička Jana";
const SENIOR_USERNAME = "babicka.jana";
const SENIOR_PASSWORD = "heslo123";

const FAMILY_NAME = "Testovací rodina";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Safety: this script DELETES and recreates accounts. Refuse to run against a
// non-local Supabase unless explicitly overridden, so it can never wipe prod.
const isLocalSupabase = /127\.0\.0\.1|localhost|:54321/.test(url);
if (!isLocalSupabase && process.env.SEED_ALLOW_REMOTE !== "1") {
  console.error(
    `Refusing to seed a non-local Supabase (${url}).\n` +
      `This script deletes and recreates accounts. Set SEED_ALLOW_REMOTE=1 to override.`,
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function deleteUserByEmail(email: string) {
  const { data } = await admin.auth.admin.listUsers();
  const existing = data?.users.find((u) => u.email === email);
  if (existing) {
    await admin.auth.admin.deleteUser(existing.id);
    console.log(`Deleted existing user: ${email}`);
  }
}

async function deleteSeniorByUsername(username: string) {
  const { data } = await admin.from("profiles").select("id").eq("username", username).maybeSingle();
  if (data) {
    await admin.auth.admin.deleteUser(data.id);
    console.log(`Deleted existing senior profile: ${username}`);
  }
}

async function run() {
  console.log("─── Seeding test account ───");

  // 1. Clean up existing accounts
  await deleteUserByEmail(OWNER_EMAIL);
  await deleteSeniorByUsername(SENIOR_USERNAME);

  // 2. Create owner auth user
  const { data: ownerAuth, error: ownerAuthErr } = await admin.auth.admin.createUser({
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: OWNER_DISPLAY_NAME },
  });
  if (ownerAuthErr || !ownerAuth.user) {
    console.error("Failed to create owner:", ownerAuthErr?.message);
    process.exit(1);
  }
  const ownerId = ownerAuth.user.id;
  console.log("Created owner:", OWNER_EMAIL);

  // 3. Insert owner profile (no family yet)
  const { error: ownerProfileErr } = await admin.from("profiles").insert({
    id: ownerId,
    role: "owner",
    email: OWNER_EMAIL,
    display_name: OWNER_DISPLAY_NAME,
  });
  if (ownerProfileErr) {
    console.error("Failed to insert owner profile:", ownerProfileErr.message);
    process.exit(1);
  }

  // 4. Insert family
  const { data: family, error: familyErr } = await admin
    .from("families")
    .insert({
      name: FAMILY_NAME,
      created_by: ownerId,
      subscription_status: "active",
      senior_display_name: SENIOR_DISPLAY_NAME,
    })
    .select("id")
    .single();
  if (familyErr || !family) {
    console.error("Failed to insert family:", familyErr?.message);
    process.exit(1);
  }
  const familyId = family.id;
  console.log("Created family:", familyId);

  // 5. Update owner profile with familyId
  await admin.from("profiles").update({ family_id: familyId }).eq("id", ownerId);

  // 6. Create senior auth user (synthetic email)
  const seniorSynthEmail = `senior.${crypto.randomUUID()}@vzpominkar.internal`;
  const { data: seniorAuth, error: seniorAuthErr } = await admin.auth.admin.createUser({
    email: seniorSynthEmail,
    password: SENIOR_PASSWORD,
    email_confirm: true,
    user_metadata: { display_name: SENIOR_DISPLAY_NAME, role: "senior", family_id: familyId },
  });
  if (seniorAuthErr || !seniorAuth.user) {
    console.error("Failed to create senior:", seniorAuthErr?.message);
    process.exit(1);
  }
  const seniorId = seniorAuth.user.id;

  const { error: seniorProfileErr } = await admin.from("profiles").insert({
    id: seniorId,
    role: "senior",
    family_id: familyId,
    display_name: SENIOR_DISPLAY_NAME,
    username: SENIOR_USERNAME,
  });
  if (seniorProfileErr) {
    console.error("Failed to insert senior profile:", seniorProfileErr.message);
    process.exit(1);
  }
  console.log("Created senior:", SENIOR_USERNAME);

  // 7. Fetch system prompts (family_id IS NULL)
  const { data: prompts } = await admin
    .from("prompts")
    .select("id")
    .is("family_id", null)
    .limit(10);
  const promptIds = (prompts ?? []).map((p: { id: string }) => p.id);

  // 8. Insert sample memories
  const memories = [
    {
      title: "Náš starý dům na vesnici",
      text_content:
        "Vyrůstala jsem v malém domku na okraji vesnice. Měl dřevěné podlahy, které vrzaly při každém kroku. V létě jsme seděli na verandě a sledovali, jak se slunce schovává za kopce. Pamatuji si vůni čerstvě posečené trávy a hluk sousedových krav.",
      status: "published",
      memory_date: "1955-07-15",
      prompt_id: promptIds[1] ?? null,
    },
    {
      title: "První den ve škole",
      text_content:
        "Ten den jsem nesla velkou aktovku, co mi sahala skoro ke kolenům. Paní učitelka Nováková nás uvítala s úsměvem a dala každému červenou tužku. Vedle mě seděla Marta, která se stala mou nejlepší kamarádkou na celých osm let.",
      status: "published",
      memory_date: "1958-09-01",
      prompt_id: promptIds[5] ?? null,
    },
    {
      title: "Vánoce u babičky",
      text_content:
        "Babička vždy pekla vánočku s rozinkami tři dny před Štědrým večerem. Celý dům voněl skořicí a vanilkou. Pod stromečkem bylo jen pár dárků, ale to vůbec nevadilo — důležité bylo, že jsme byli všichni pohromadě.",
      status: "published",
      memory_date: "1962-12-24",
      prompt_id: promptIds[4] ?? null,
    },
    {
      title: "Jak jsem potkala dědečka",
      text_content:
        "Bylo to na závodech v Jičíně. Přišel ke mně se dvěma limonádami a řekl: 'Myslím, že ta jedna je pro vás.' Bylo mi dvacet jedna a on dvacet čtyři. Za dva roky jsme se vzali.",
      status: "published",
      memory_date: "1968-08-20",
      prompt_id: promptIds[2] ?? null,
    },
    {
      title: "Naše první auto — Škodovka 100",
      text_content:
        "Na auto jsme šetřili čtyři roky. Když ho táta přivezl domů, celá ulice se přišla podívat. Byla to bílá Škoda 100 a táta ji leštil každou sobotu dopoledne. První výlet jsme podnikli do Prahy — a zpátky.",
      status: "published",
      memory_date: "1973-05-10",
      prompt_id: promptIds[3] ?? null,
    },
    {
      title: "Léto v Jugoslávii",
      text_content:
        "Jednou jsme dostali příležitost jet s odborovým zájezdem k moři. Pamatuji si, jak jsem poprvé vstoupila do Jaderského moře — voda byla průzračně modrá a teplá. Děti od rána do večera skákaly z mola a já jim říkala, aby byly opatrné.",
      status: "published",
      memory_date: "1978-08-01",
      prompt_id: null,
    },
    {
      title: "Jak jsem se naučila péct svíčkovou",
      text_content:
        "Recept mi dala tchyně napsaný na útržku papíru. Strávila jsem nad ním celé odpoledne a omáčka stejně nebyla dost hustá. Teprve napotřetí se to povedlo a děti říkaly, že je to nejlepší jídlo na světě.",
      status: "published",
      memory_date: "1980-03-15",
      prompt_id: null,
    },
    {
      title: "Sametová revoluce v naší ulici",
      text_content:
        "17. listopadu jsme stáli na náměstí a cinkali klíči. Byl mráz, ale nikdo nešel domů. Sousedka přinesla termosku s čajem a sdílela ji se všemi okolo. Ten večer jsme věděli, že se něco zásadního mění.",
      status: "published",
      memory_date: "1989-11-17",
      prompt_id: null,
    },
    {
      title: "Narozeninová oslava pro celou rodinu",
      text_content:
        "K sedmdesátinám mi děti zorganizovaly překvapení. Přijeli i ti, které jsem neviděla přes deset let. Seděli jsme na zahradě až do půlnoci, zpívali staré písničky a prohlíželi alba s fotografiemi.",
      status: "draft",
      memory_date: "2018-06-03",
      prompt_id: null,
    },
    {
      title: "Jak si pamatuji naši zahradu",
      text_content: "Na zahradě rostly tři jabloně a jeden rybíz, který nikdo neměl rád kromě mě.",
      status: "draft",
      memory_date: "1975-09-01",
      prompt_id: null,
    },
  ];

  for (const m of memories) {
    const { error } = await admin.from("memories").insert({
      family_id: familyId,
      author_id: seniorId,
      title: m.title,
      text_content: m.text_content,
      status: m.status,
      memory_date: m.memory_date,
      prompt_id: m.prompt_id,
      audio_path: null,
    });
    if (error) {
      console.error(`Failed to insert memory "${m.title}":`, error.message);
    }
  }
  console.log(`Inserted ${memories.length} sample memories.`);

  console.log("\n✓ Done.");
  console.log(`  Owner:  ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log(`  Senior: ${SENIOR_USERNAME} / ${SENIOR_PASSWORD}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
