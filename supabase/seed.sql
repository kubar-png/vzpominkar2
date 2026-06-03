-- Vzpomínkář system prompts seed (Czech).
-- 34 starter questions across 8 categories. family_id = null marks them as
-- system-wide (owners can pick from these in the onboarding wizard).
--
-- Voice: these are questions the senior answers, so they use tykání (informal),
-- matching the physical book. Gendered past-tense participles are written as a
-- "{masc|fem}" token resolved by lib/gender.ts (male / female / "vyrůstal/a"
-- fallback) using the senior's profiles.gender. Everything the COMPANY says to
-- the buyer stays vykání — only these senior-facing questions tykají.

insert into public.prompts (family_id, category, question, order_index) values
  -- DĚTSTVÍ
  (null, 'detstvi', 'Jaká je tvoje nejranější vzpomínka? Kolik ti tehdy mohlo být let?', 10),
  (null, 'detstvi', 'Kde jsi {vyrůstal|vyrůstala}? Popiš dům nebo byt, ve kterém jsi {bydlel|bydlela}.', 20),
  (null, 'detstvi', 'Jakou hru sis jako dítě nejraději {hrál|hrála} a s kým?', 30),
  (null, 'detstvi', 'Co u tebe doma bývalo na nedělní oběd? A kdo ho vařil?', 40),
  (null, 'detstvi', 'Jak vypadaly Vánoce ve tvé rodině za tvého dětství?', 50),

  -- ŠKOLA
  (null, 'skola', 'Vzpomínáš si na svůj první školní den? Jaký byl?', 60),
  (null, 'skola', 'Kdo byl tvůj nejoblíbenější učitel a proč?', 70),
  (null, 'skola', 'Kdo byl tvůj nejlepší kamarád nebo kamarádka? Co o nich víš dnes?', 80),
  (null, 'skola', 'Jaký školní zážitek tě nejvíc potrápil — a jak to nakonec dopadlo?', 90),

  -- MLADÍ
  (null, 'mladi', 'Co byl tvůj první větší sen, když ti bylo kolem dvaceti?', 100),
  (null, 'mladi', 'Kam jsi {jezdil|jezdila} s kamarády? {Měl|Měla} jsi nějaké oblíbené místo?', 110),
  (null, 'mladi', 'Jaká hudba se ti líbila, když ti bylo dvacet?', 120),
  (null, 'mladi', 'Vzpomínáš si na nějakou cestu, která tě v mládí změnila?', 130),

  -- LÁSKA
  (null, 'laska', 'Jak ses {seznámil|seznámila} se svým partnerem nebo partnerkou? Vzpomínáš si na první setkání?', 140),
  (null, 'laska', 'Co tě na něm/ní tehdy nejvíc zaujalo?', 150),
  (null, 'laska', 'Jaká byla tvoje svatba? Co si z ní pamatuješ nejlíp?', 160),
  (null, 'laska', 'Co byl nejtěžší okamžik tvého vztahu?', 170),

  -- RODINA
  (null, 'rodina', 'Pamatuješ si na den, kdy se ti narodilo první dítě?', 180),
  (null, 'rodina', 'Která rodinná tradice ti byla nejdražší a proč?', 190),
  (null, 'rodina', 'Kdo z rodiny tě nejvíc ovlivnil a v čem?', 200),
  (null, 'rodina', 'Jaký rodinný recept se u tebe v rodině předává z generace na generaci?', 210),

  -- PRÁCE
  (null, 'prace', 'Jaké bylo tvoje první zaměstnání? Jak ses k němu {dostal|dostala}?', 220),
  (null, 'prace', 'Co byl nejhezčí den ve tvé kariéře?', 230),
  (null, 'prace', 'Kdo byl kolega nebo kolegyně, kterých si dodnes vážíš?', 240),
  (null, 'prace', 'Vzpomínáš si na pracovní výzvu, která tě pořádně prověřila?', 250),

  -- ZÁJMY
  (null, 'zajmy', 'Jaký koníček tě dlouhodobě baví? Jak ses k němu {dostal|dostala}?', 260),
  (null, 'zajmy', 'Která kniha nebo film tě v životě zasáhly nejvíc?', 270),
  (null, 'zajmy', '{Měl|Měla} jsi někdy zvíře, které pro tebe hodně znamenalo? Vyprávěj o něm.', 280),
  (null, 'zajmy', 'Jaké místo na světě bys {rád|ráda} {viděl|viděla} ještě jednou — a proč?', 290),

  -- ŽIVOTNÍ MOUDRO
  (null, 'moudro', 'Co bys {poradil|poradila} svému dvacetiletému já?', 300),
  (null, 'moudro', 'Co považuješ v životě za to nejdůležitější?', 310),
  (null, 'moudro', 'Z čeho máš ve svém životě největší radost?', 320),
  (null, 'moudro', 'Co by tvoje vnoučata měla vědět o světě tvého mládí?', 330),
  (null, 'moudro', 'Když se ohlédneš zpět, co v tobě vzbuzuje největší hrdost?', 340)
on conflict do nothing;
