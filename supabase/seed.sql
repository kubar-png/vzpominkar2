-- Vzpomínkář system prompts seed (Czech).
-- 34 starter questions across 8 categories. family_id = null marks them as
-- system-wide (owners can pick from these in the onboarding wizard).

insert into public.prompts (family_id, category, question, order_index) values
  -- DĚTSTVÍ
  (null, 'detstvi', 'Jaká je vaše nejranější vzpomínka? Kolik vám tehdy mohlo být let?', 10),
  (null, 'detstvi', 'Kde jste vyrůstali? Popište dům nebo byt, ve kterém jste bydleli.', 20),
  (null, 'detstvi', 'Jakou hru jste si v dětství nejraději hráli a s kým?', 30),
  (null, 'detstvi', 'Co jste mívali na nedělní oběd? A kdo ho vařil?', 40),
  (null, 'detstvi', 'Jak vypadaly Vánoce ve vaší rodině, když jste byli malí?', 50),

  -- ŠKOLA
  (null, 'skola', 'Vzpomínáte si na svůj první školní den? Jaký byl?', 60),
  (null, 'skola', 'Kdo byl váš nejoblíbenější učitel a proč?', 70),
  (null, 'skola', 'Měli jste ve škole nějakého nejlepšího kamaráda nebo kamarádku? Co o nich víte dnes?', 80),
  (null, 'skola', 'Jaký školní zážitek vás nejvíc potrápil — a jak jste to nakonec zvládli?', 90),

  -- MLADÍ
  (null, 'mladi', 'Co byl váš první větší sen, když vám bylo kolem dvaceti?', 100),
  (null, 'mladi', 'Kam jste jezdili s kamarády? Měli jste nějaké oblíbené místo?', 110),
  (null, 'mladi', 'Jakou hudbu jste poslouchali, když vám bylo dvacet?', 120),
  (null, 'mladi', 'Vzpomínáte si na nějakou cestu, která vás v mládí změnila?', 130),

  -- LÁSKA
  (null, 'laska', 'Jak jste se seznámili se svým partnerem nebo partnerkou? Vzpomínáte si na první setkání?', 140),
  (null, 'laska', 'Co vám na něm/ní tehdy nejvíc imponovalo?', 150),
  (null, 'laska', 'Jaká byla vaše svatba? Co si z ní pamatujete nejlíp?', 160),
  (null, 'laska', 'Co byl nejtěžší okamžik, který jste spolu zvládli?', 170),

  -- RODINA
  (null, 'rodina', 'Pamatujete si na den, kdy se vám narodilo první dítě?', 180),
  (null, 'rodina', 'Která rodinná tradice vám byla nejdražší a proč?', 190),
  (null, 'rodina', 'Kdo z rodiny vás nejvíc ovlivnil a v čem?', 200),
  (null, 'rodina', 'Jaký rodinný recept se u vás předává z generace na generaci?', 210),

  -- PRÁCE
  (null, 'prace', 'Jaké bylo vaše první zaměstnání? Jak jste se k němu dostali?', 220),
  (null, 'prace', 'Co byl nejhezčí den ve vaší kariéře?', 230),
  (null, 'prace', 'Měli jste kolegu nebo kolegyni, kterých si dodnes vážíte?', 240),
  (null, 'prace', 'Vzpomínáte si na nějakou pracovní výzvu, která vás dost prověřila?', 250),

  -- ZÁJMY
  (null, 'zajmy', 'Jaký koníček vás dlouhodobě baví? Jak jste se k němu dostali?', 260),
  (null, 'zajmy', 'Která kniha nebo film vás v životě zasáhly nejvíc?', 270),
  (null, 'zajmy', 'Měli jste někdy zvíře, které pro vás hodně znamenalo? Vyprávějte o něm.', 280),
  (null, 'zajmy', 'Jaké místo na světě byste rádi viděli ještě jednou — a proč?', 290),

  -- ŽIVOTNÍ MOUDRO
  (null, 'moudro', 'Co byste poradili svému dvacetiletému já, kdybyste mohli?', 300),
  (null, 'moudro', 'Co považujete v životě za to nejdůležitější?', 310),
  (null, 'moudro', 'Z čeho máte ve svém životě největší radost?', 320),
  (null, 'moudro', 'Co by vaše vnoučata měla podle vás vědět o světě, ve kterém jste vyrůstali?', 330),
  (null, 'moudro', 'Když se ohlédnete zpět, na co jste opravdu hrdí?', 340)
on conflict do nothing;
