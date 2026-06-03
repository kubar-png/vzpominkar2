-- Vzpomínkář system prompts seed (Czech).
-- 65 starter questions across 8 categories. family_id = null marks them as
-- system-wide (owners can pick from these in the onboarding wizard).
--
-- Voice: these are questions the senior answers, so they use tykání (informal),
-- matching the physical book. Gendered past-tense participles are written as a
-- "{masc|fem}" token resolved by lib/gender.ts (male / female / "vyrůstal/a"
-- fallback) using the senior's profiles.gender. Everything the COMPANY says to
-- the buyer stays vykání — only these senior-facing questions tykají.
--
-- This file mirrors the live library (kept in sync 2026-06-03); some order_index
-- values repeat across categories — that's intentional ordering within a phase.

insert into public.prompts (family_id, category, question, order_index) values
  -- DĚTSTVÍ
  (null, 'detstvi', 'Jaká je tvoje nejranější vzpomínka? Kolik ti tehdy mohlo být let?', 10),
  (null, 'detstvi', 'Kde jsi {vyrůstal|vyrůstala}? Popiš dům nebo byt, ve kterém jsi {bydlel|bydlela}.', 20),
  (null, 'detstvi', 'Jakou hru sis jako dítě nejraději {hrál|hrála} a s kým?', 30),
  (null, 'detstvi', 'Co u tebe doma bývalo na nedělní oběd? A kdo ho vařil?', 40),
  (null, 'detstvi', 'Jak vypadaly Vánoce ve tvé rodině za tvého dětství?', 50),
  (null, 'detstvi', 'Kde jsi {vyrůstal|vyrůstala} a jak vypadal dům nebo byt, kde jsi jako dítě {bydlel|bydlela}?', 100),
  (null, 'detstvi', 'Jaká hračka nebo hra tě v dětství bavila nejvíc a proč?', 101),
  (null, 'detstvi', 'Jak vypadaly tvoje letní prázdniny — kam jsi {jezdil|jezdila} a co jsi {dělal|dělala}?', 102),
  (null, 'detstvi', 'Máš vzpomínku na chvíli, kdy ses jako dítě {cítil|cítila} obzvlášť {šťastný|šťastná} nebo {hrdý|hrdá}?', 103),
  (null, 'detstvi', 'Jaká zvířata nebo příroda tě v dětství obklopovala a která si pamatuješ nejraději?', 104),

  -- ŠKOLA
  (null, 'skola', 'Vzpomínáš si na svůj první školní den? Jaký byl?', 60),
  (null, 'skola', 'Kdo byl tvůj nejoblíbenější učitel a proč?', 70),
  (null, 'skola', 'Kdo byl tvůj nejlepší kamarád nebo kamarádka? Co o nich víš dnes?', 80),
  (null, 'skola', 'Jaký školní zážitek tě nejvíc potrápil — a jak to nakonec dopadlo?', 90),
  (null, 'skola', 'Pamatuješ si na svého oblíbeného učitele nebo učitelku? Co tě na nich zaujalo?', 200),
  (null, 'skola', 'Jaký byl tvůj nejoblíbenější předmět ve škole a co tě na něm bavilo?', 201),
  (null, 'skola', 'Jak vypadala tvoje školní třída — kdo byl tvůj nejlepší kamarád a na co dnes vzpomínáš?', 202),
  (null, 'skola', 'Vzpomínáš si na školní výlet nebo akci, která ti zůstala nejdéle v paměti?', 203),
  (null, 'skola', 'Jaké bylo tvoje oblíbené jídlo ve školní jídelně nebo co sis {nosil|nosila} k obědu?', 204),

  -- MLADÍ
  (null, 'mladi', 'Co byl tvůj první větší sen, když ti bylo kolem dvaceti?', 100),
  (null, 'mladi', 'Kam jsi {jezdil|jezdila} s kamarády? {Měl|Měla} jsi nějaké oblíbené místo?', 110),
  (null, 'mladi', 'Jaká hudba se ti líbila, když ti bylo dvacet?', 120),
  (null, 'mladi', 'Vzpomínáš si na nějakou cestu, která tě v mládí změnila?', 130),
  (null, 'mladi', 'Jak vypadalo tvoje první zaměstnání nebo brigáda — co jsi {dělal|dělala} a co tě překvapilo?', 300),
  (null, 'mladi', 'Co bylo tvým největším snem nebo přáním, když ti bylo dvacet let?', 301),
  (null, 'mladi', 'Jak jsi {trávil|trávila} volné večery nebo víkendy v mládí — co bylo tehdy zábavou?', 302),
  (null, 'mladi', 'Která hudba, tanec nebo móda patřila k tvému mládí a na co z toho vzpomínáš?', 303),

  -- LÁSKA
  (null, 'laska', 'Jak ses {seznámil|seznámila} se svým partnerem nebo partnerkou? Vzpomínáš si na první setkání?', 140),
  (null, 'laska', 'Co tě na něm/ní tehdy nejvíc zaujalo?', 150),
  (null, 'laska', 'Jaká byla tvoje svatba? Co si z ní pamatuješ nejlíp?', 160),
  (null, 'laska', 'Co byl nejtěžší okamžik tvého vztahu?', 170),
  (null, 'laska', 'Kde a jak ses poprvé {setkal|setkala} se svým partnerem nebo partnerkou?', 400),
  (null, 'laska', 'Jak probíhalo tvoje první rande nebo námluvy — co si z toho nejlépe pamatuješ?', 401),
  (null, 'laska', 'Jaký byl tvůj svatební den — co se ti z něj nejvíce vrylo do paměti?', 402),
  (null, 'laska', 'Co považuješ za tajemství šťastného vztahu nebo partnerství?', 403),

  -- RODINA
  (null, 'rodina', 'Pamatuješ si na den, kdy se ti narodilo první dítě?', 180),
  (null, 'rodina', 'Která rodinná tradice ti byla nejdražší a proč?', 190),
  (null, 'rodina', 'Kdo z rodiny tě nejvíc ovlivnil a v čem?', 200),
  (null, 'rodina', 'Jaký rodinný recept se u tebe v rodině předává z generace na generaci?', 210),
  (null, 'rodina', 'Jaké byly tvoje rodinné vánoční tradice — co se doma vždy muselo dít?', 500),
  (null, 'rodina', 'Jak vypadaly rodinné neděle nebo svátky u prarodičů — co tě tam jako dítě čekalo?', 501),
  (null, 'rodina', 'Jaký byl tvůj vztah se sourozenci — {hádal|hádala} ses s nimi, nebo jsi jim spíš {pomáhal|pomáhala}?', 502),
  (null, 'rodina', 'Co ti tvoji rodiče nebo prarodiče říkávali, co si pamatuješ dodnes?', 503),
  (null, 'rodina', 'Jak jsi {slavil|slavila} Velikonoce nebo jiné svátky a co z toho bylo nejdůležitější?', 504),

  -- PRÁCE
  (null, 'prace', 'Jaké bylo tvoje první zaměstnání? Jak ses k němu {dostal|dostala}?', 220),
  (null, 'prace', 'Co byl nejhezčí den ve tvé kariéře?', 230),
  (null, 'prace', 'Kdo byl kolega nebo kolegyně, kterých si dodnes vážíš?', 240),
  (null, 'prace', 'Vzpomínáš si na pracovní výzvu, která tě pořádně prověřila?', 250),
  (null, 'prace', 'Na jakou práci nebo profesi jsi {byl|byla} nejvíce {hrdý|hrdá} a proč?', 600),
  (null, 'prace', 'Pamatuješ si na kolegu, šéfa nebo zákazníka, který tě nějak výrazně ovlivnil?', 601),
  (null, 'prace', 'Byl moment v práci nebo kariéře, na který vzpomínáš s obzvláštní hrdostí?', 602),
  (null, 'prace', 'Co tě v práci bavilo nejvíce za celý tvůj pracovní život?', 603),

  -- ZÁJMY
  (null, 'zajmy', 'Jaký koníček tě dlouhodobě baví? Jak ses k němu {dostal|dostala}?', 260),
  (null, 'zajmy', 'Která kniha nebo film tě v životě zasáhly nejvíc?', 270),
  (null, 'zajmy', '{Měl|Měla} jsi někdy zvíře, které pro tebe hodně znamenalo? Vyprávěj o něm.', 280),
  (null, 'zajmy', 'Jaké místo na světě bys {rád|ráda} {viděl|viděla} ještě jednou — a proč?', 290),
  (null, 'zajmy', 'Jaký koníček jsi {provozoval|provozovala} dlouhá léta a co tě na něm tolik bavilo?', 700),
  (null, 'zajmy', 'Na jakou dovolenou nebo cestu vzpomínáš nejraději a proč?', 701),
  (null, 'zajmy', 'Pamatuješ si na knihu, film nebo divadelní představení, které tě v životě nejvíce zasáhlo?', 702),
  (null, 'zajmy', 'Jaký sport nebo pohybová aktivita ti byly v životě blízké?', 703),

  -- ŽIVOTNÍ MOUDRO
  (null, 'moudro', 'Co bys {poradil|poradila} svému dvacetiletému já?', 300),
  (null, 'moudro', 'Co považuješ v životě za to nejdůležitější?', 310),
  (null, 'moudro', 'Z čeho máš ve svém životě největší radost?', 320),
  (null, 'moudro', 'Co by tvoje vnoučata měla vědět o světě tvého mládí?', 330),
  (null, 'moudro', 'Když se ohlédneš zpět, co v tobě vzbuzuje největší hrdost?', 340)
on conflict do nothing;
