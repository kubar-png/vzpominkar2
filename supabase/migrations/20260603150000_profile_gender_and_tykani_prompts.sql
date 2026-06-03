-- Recipient gender + tykání prompts.
--
-- 1) profiles.gender — grammatical gender for Czech tykání in the questions a
--    senior is asked. Backfilled from senior_role (babička→female, dědeček→male …).
-- 2) Rewrite the system prompt library (family_id is null) to tykání, with
--    "{masc|fem}" tokens for gendered participles (resolved by lib/gender.ts).
--    Matched by order_index so it's robust to text drift; a no-op on rows that
--    don't match. Custom family prompts are left untouched.

-- 1) gender column ----------------------------------------------------------
alter table public.profiles
  add column if not exists gender text
    check (gender is null or gender in ('male', 'female'));

comment on column public.profiles.gender is
  'Grammatical gender for Czech address (tykání) in the questions the senior is asked. Owners may be null.';

update public.profiles set gender = 'female'
  where gender is null and senior_role in ('babicka', 'mama', 'prababicka', 'teta');
update public.profiles set gender = 'male'
  where gender is null and senior_role in ('dedecek', 'tata', 'pradedecek', 'stryc');

-- 2) tykání + tokens for the system prompt library --------------------------
update public.prompts as p
set question = v.q
from (values
  (10,  'Jaká je tvoje nejranější vzpomínka? Kolik ti tehdy mohlo být let?'),
  (20,  'Kde jsi {vyrůstal|vyrůstala}? Popiš dům nebo byt, ve kterém jsi {bydlel|bydlela}.'),
  (30,  'Jakou hru sis jako dítě nejraději {hrál|hrála} a s kým?'),
  (40,  'Co u tebe doma bývalo na nedělní oběd? A kdo ho vařil?'),
  (50,  'Jak vypadaly Vánoce ve tvé rodině za tvého dětství?'),
  (60,  'Vzpomínáš si na svůj první školní den? Jaký byl?'),
  (70,  'Kdo byl tvůj nejoblíbenější učitel a proč?'),
  (80,  'Kdo byl tvůj nejlepší kamarád nebo kamarádka? Co o nich víš dnes?'),
  (90,  'Jaký školní zážitek tě nejvíc potrápil — a jak to nakonec dopadlo?'),
  (100, 'Co byl tvůj první větší sen, když ti bylo kolem dvaceti?'),
  (110, 'Kam jsi {jezdil|jezdila} s kamarády? {Měl|Měla} jsi nějaké oblíbené místo?'),
  (120, 'Jaká hudba se ti líbila, když ti bylo dvacet?'),
  (130, 'Vzpomínáš si na nějakou cestu, která tě v mládí změnila?'),
  (140, 'Jak ses {seznámil|seznámila} se svým partnerem nebo partnerkou? Vzpomínáš si na první setkání?'),
  (150, 'Co tě na něm/ní tehdy nejvíc zaujalo?'),
  (160, 'Jaká byla tvoje svatba? Co si z ní pamatuješ nejlíp?'),
  (170, 'Co byl nejtěžší okamžik tvého vztahu?'),
  (180, 'Pamatuješ si na den, kdy se ti narodilo první dítě?'),
  (190, 'Která rodinná tradice ti byla nejdražší a proč?'),
  (200, 'Kdo z rodiny tě nejvíc ovlivnil a v čem?'),
  (210, 'Jaký rodinný recept se u tebe v rodině předává z generace na generaci?'),
  (220, 'Jaké bylo tvoje první zaměstnání? Jak ses k němu {dostal|dostala}?'),
  (230, 'Co byl nejhezčí den ve tvé kariéře?'),
  (240, 'Kdo byl kolega nebo kolegyně, kterých si dodnes vážíš?'),
  (250, 'Vzpomínáš si na pracovní výzvu, která tě pořádně prověřila?'),
  (260, 'Jaký koníček tě dlouhodobě baví? Jak ses k němu {dostal|dostala}?'),
  (270, 'Která kniha nebo film tě v životě zasáhly nejvíc?'),
  (280, '{Měl|Měla} jsi někdy zvíře, které pro tebe hodně znamenalo? Vyprávěj o něm.'),
  (290, 'Jaké místo na světě bys {rád|ráda} {viděl|viděla} ještě jednou — a proč?'),
  (300, 'Co bys {poradil|poradila} svému dvacetiletému já?'),
  (310, 'Co považuješ v životě za to nejdůležitější?'),
  (320, 'Z čeho máš ve svém životě největší radost?'),
  (330, 'Co by tvoje vnoučata měla vědět o světě tvého mládí?'),
  (340, 'Když se ohlédneš zpět, co v tobě vzbuzuje největší hrdost?')
) as v(idx, q)
where p.family_id is null and p.order_index = v.idx;
