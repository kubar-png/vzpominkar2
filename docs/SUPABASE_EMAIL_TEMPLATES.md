# Supabase Auth — Email Templates

These templates live in **Supabase Dashboard → Authentication → Email Templates**, not in this repo. Each section below corresponds to one Supabase template. Paste the **Subject** into the subject field and the **HTML** into the message body field. Keep `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .Token }}` placeholders verbatim — Supabase substitutes them at send time.

A plain-text fallback is included for reference. Supabase does not currently expose a separate text field per template, but the HTML rendered here degrades cleanly when the client strips styles.

Brand reference (same as `lib/email/templates.ts`):

- Cream `#f4ebd6` · Paper `#fbf5e3` · Ink `#0e3b64` · Ink-soft `#5a6b7c`
- Gold `#d4a017` · Oxblood `#a8231f` · Hairline `#e8dec3`
- Display: Georgia · Body: system stack · Wordmark: Bradley Hand

---

## 1. Confirm signup — _Confirm signup_

### Subject

```
Potvrďte svou e-mailovou adresu ve Vzpomínkáři
```

### HTML

```html
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Potvrďte svou e-mailovou adresu</title>
</head>
<body style="margin:0;padding:0;background:#f4ebd6;color:#0e3b64;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;height:0;width:0;font-size:1px;line-height:1px;">
    Klepnutím na odkaz potvrdíte svou e-mailovou adresu a otevřete Vzpomínkář.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4ebd6;">
    <tr><td align="center" style="padding:40px 16px 24px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td align="left" style="padding:0 8px 20px 8px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5a6b7c;margin:0 0 6px 0;">Potvrzení e-mailu</div>
          <div style="font-family:'Bradley Hand','Brush Script MT',cursive;font-size:28px;color:#0e3b64;line-height:1;">Vzpomínkář</div>
        </td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fbf5e3;border:1px solid #e8dec3;border-radius:14px;">
        <tr><td style="padding:36px 36px 32px 36px;font-size:16px;line-height:1.6;color:#0e3b64;">
          <h1 style="margin:0 0 18px 0;font-family:Georgia,'Times New Roman',serif;font-size:30px;line-height:1.15;font-weight:400;letter-spacing:-0.01em;">
            Potvrďte svou e-mailovou adresu.
          </h1>
          <p style="margin:0 0 14px 0;">
            Děkujeme za registraci. Pro dokončení stačí jediné klepnutí &mdash; potvrdíme tím,
            že je adresa <strong>{{ .Email }}</strong> opravdu vaše.
          </p>
          <p style="margin:24px 0 8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:#d4a017;border-radius:999px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Potvrdit e-mail &#8599;
              </a>
            </td></tr></table>
          </p>
          <div style="height:1px;background:#e8dec3;margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <p style="margin:0;font-size:14px;color:#5a6b7c;">
            Pokud jste registraci nezakládali, klidně tento e-mail ignorujte. Žádný účet nevznikne.
          </p>
          <p style="margin:24px 0 0 0;font-family:'Bradley Hand','Brush Script MT',cursive;font-size:20px;color:#0e3b64;">Kuba a tým Vzpomínkáře</p>
        </td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin-top:24px;">
        <tr><td style="padding:0 8px;">
          <div style="height:1px;background:#e8dec3;margin:0 0 16px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <table role="presentation" width="100%"><tr>
            <td align="left" style="font-size:11px;color:#5a6b7c;">Vzpomínkář &middot; Praha &middot; ahoj@vzpominkar.cz</td>
            <td align="right" style="font-family:Georgia,serif;font-size:11px;color:#5a6b7c;letter-spacing:0.12em;">MMXXVI</td>
          </tr></table>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>
```

### Plain-text fallback (for reference)

```
Potvrďte svou e-mailovou adresu.

Děkujeme za registraci. Pro dokončení stačí jediné klepnutí — potvrdíme tím, že je adresa {{ .Email }} opravdu vaše.

Potvrdit e-mail: {{ .ConfirmationURL }}

Pokud jste registraci nezakládali, klidně tento e-mail ignorujte. Žádný účet nevznikne.

Kuba a tým Vzpomínkáře
```

---

## 2. Magic Link — _Magic Link_

### Subject

```
Váš přihlašovací odkaz do Vzpomínkáře
```

### HTML

```html
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Váš přihlašovací odkaz</title>
</head>
<body style="margin:0;padding:0;background:#f4ebd6;color:#0e3b64;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">
    Odkaz vyprší za hodinu. Klepněte a jste uvnitř.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4ebd6;">
    <tr><td align="center" style="padding:40px 16px 24px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td align="left" style="padding:0 8px 20px 8px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5a6b7c;margin:0 0 6px 0;">Přihlášení</div>
          <div style="font-family:'Bradley Hand','Brush Script MT',cursive;font-size:28px;color:#0e3b64;">Vzpomínkář</div>
        </td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fbf5e3;border:1px solid #e8dec3;border-radius:14px;">
        <tr><td style="padding:36px;font-size:16px;line-height:1.6;color:#0e3b64;">
          <h1 style="margin:0 0 18px 0;font-family:Georgia,serif;font-size:30px;line-height:1.15;font-weight:400;letter-spacing:-0.01em;">
            Váš přihlašovací odkaz.
          </h1>
          <p style="margin:0 0 14px 0;">
            Klepnutím na tlačítko se přihlásíte do Vzpomínkáře. Odkaz je platný hodinu a dá se použít
            jen jednou.
          </p>
          <p style="margin:24px 0 8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:#d4a017;border-radius:999px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Přihlásit se &#8599;
              </a>
            </td></tr></table>
          </p>
          <div style="height:1px;background:#e8dec3;margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <p style="margin:0;font-size:14px;color:#5a6b7c;">
            Pokud jste o odkaz nežádali, klidně zprávu ignorujte &mdash; nic se nestalo.
          </p>
        </td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin-top:24px;">
        <tr><td style="padding:0 8px;">
          <div style="height:1px;background:#e8dec3;margin:0 0 16px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <table role="presentation" width="100%"><tr>
            <td align="left" style="font-size:11px;color:#5a6b7c;">Vzpomínkář &middot; Praha &middot; ahoj@vzpominkar.cz</td>
            <td align="right" style="font-family:Georgia,serif;font-size:11px;color:#5a6b7c;letter-spacing:0.12em;">MMXXVI</td>
          </tr></table>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>
```

### Plain-text fallback

```
Váš přihlašovací odkaz.

Klepnutím na odkaz se přihlásíte do Vzpomínkáře. Odkaz je platný hodinu a dá se použít jen jednou.

Přihlásit se: {{ .ConfirmationURL }}

Pokud jste o odkaz nežádali, klidně zprávu ignorujte — nic se nestalo.
```

---

## 3. Reset password — _Reset Password_

### Subject

```
Obnovení hesla ve Vzpomínkáři
```

### HTML

```html
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Obnovení hesla</title>
</head>
<body style="margin:0;padding:0;background:#f4ebd6;color:#0e3b64;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">
    Klepnutím nastavíte nové heslo. Odkaz platí jednu hodinu.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4ebd6;">
    <tr><td align="center" style="padding:40px 16px 24px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td align="left" style="padding:0 8px 20px 8px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5a6b7c;margin:0 0 6px 0;">Obnovení hesla</div>
          <div style="font-family:'Bradley Hand','Brush Script MT',cursive;font-size:28px;color:#0e3b64;">Vzpomínkář</div>
        </td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fbf5e3;border:1px solid #e8dec3;border-radius:14px;">
        <tr><td style="padding:36px;font-size:16px;line-height:1.6;color:#0e3b64;">
          <h1 style="margin:0 0 18px 0;font-family:Georgia,serif;font-size:30px;line-height:1.15;font-weight:400;letter-spacing:-0.01em;">
            Nastavte si nové heslo.
          </h1>
          <p style="margin:0 0 14px 0;">
            Někdo &mdash; pravděpodobně vy &mdash; požádal o obnovení hesla k účtu <strong>{{ .Email }}</strong>.
            Klepnutím na tlačítko si nastavíte nové.
          </p>
          <p style="margin:24px 0 8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:#d4a017;border-radius:999px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Nastavit nové heslo &#8599;
              </a>
            </td></tr></table>
          </p>
          <div style="height:1px;background:#e8dec3;margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <p style="margin:0 0 8px 0;font-size:14px;color:#5a6b7c;">
            Odkaz platí jednu hodinu a dá se použít jen jednou.
          </p>
          <p style="margin:0;font-size:14px;color:#a8231f;">
            Pokud jste o obnovení nežádali, ignorujte tuto zprávu &mdash; vaše heslo zůstává beze změny.
          </p>
        </td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin-top:24px;">
        <tr><td style="padding:0 8px;">
          <div style="height:1px;background:#e8dec3;margin:0 0 16px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <table role="presentation" width="100%"><tr>
            <td align="left" style="font-size:11px;color:#5a6b7c;">Vzpomínkář &middot; Praha &middot; ahoj@vzpominkar.cz</td>
            <td align="right" style="font-family:Georgia,serif;font-size:11px;color:#5a6b7c;letter-spacing:0.12em;">MMXXVI</td>
          </tr></table>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>
```

### Plain-text fallback

```
Nastavte si nové heslo.

Někdo — pravděpodobně vy — požádal o obnovení hesla k účtu {{ .Email }}. Klepnutím na odkaz si nastavíte nové.

Nastavit nové heslo: {{ .ConfirmationURL }}

Odkaz platí jednu hodinu a dá se použít jen jednou.
Pokud jste o obnovení nežádali, ignorujte tuto zprávu — vaše heslo zůstává beze změny.
```

---

## 4. Change email address — _Change Email Address_

### Subject

```
Potvrďte změnu e-mailové adresy
```

### HTML

```html
<!doctype html>
<html lang="cs">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Potvrďte změnu e-mailu</title>
</head>
<body style="margin:0;padding:0;background:#f4ebd6;color:#0e3b64;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0;">
    Potvrďte novou adresu, kterou budete ve Vzpomínkáři používat.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4ebd6;">
    <tr><td align="center" style="padding:40px 16px 24px 16px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">
        <tr><td align="left" style="padding:0 8px 20px 8px;">
          <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#5a6b7c;margin:0 0 6px 0;">Změna e-mailu</div>
          <div style="font-family:'Bradley Hand','Brush Script MT',cursive;font-size:28px;color:#0e3b64;">Vzpomínkář</div>
        </td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#fbf5e3;border:1px solid #e8dec3;border-radius:14px;">
        <tr><td style="padding:36px;font-size:16px;line-height:1.6;color:#0e3b64;">
          <h1 style="margin:0 0 18px 0;font-family:Georgia,serif;font-size:30px;line-height:1.15;font-weight:400;letter-spacing:-0.01em;">
            Potvrďte novou e-mailovou adresu.
          </h1>
          <p style="margin:0 0 14px 0;">
            Žádáte o změnu adresy pro váš účet ve Vzpomínkáři. Pro dokončení stačí klepnout na tlačítko
            níže &mdash; potvrdíme, že nová adresa <strong>{{ .Email }}</strong> je opravdu vaše.
          </p>
          <p style="margin:24px 0 8px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="background:#d4a017;border-radius:999px;">
              <a href="{{ .ConfirmationURL }}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;line-height:1;">
                Potvrdit změnu &#8599;
              </a>
            </td></tr></table>
          </p>
          <div style="height:1px;background:#e8dec3;margin:24px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <p style="margin:0;font-size:14px;color:#a8231f;">
            Pokud jste o změnu nežádali, neklepejte na odkaz a napište nám na ahoj@vzpominkar.cz.
          </p>
        </td></tr>
      </table>

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;margin-top:24px;">
        <tr><td style="padding:0 8px;">
          <div style="height:1px;background:#e8dec3;margin:0 0 16px 0;line-height:1px;font-size:1px;">&nbsp;</div>
          <table role="presentation" width="100%"><tr>
            <td align="left" style="font-size:11px;color:#5a6b7c;">Vzpomínkář &middot; Praha &middot; ahoj@vzpominkar.cz</td>
            <td align="right" style="font-family:Georgia,serif;font-size:11px;color:#5a6b7c;letter-spacing:0.12em;">MMXXVI</td>
          </tr></table>
        </td></tr>
      </table>

    </td></tr>
  </table>
</body>
</html>
```

### Plain-text fallback

```
Potvrďte novou e-mailovou adresu.

Žádáte o změnu adresy pro váš účet ve Vzpomínkáři. Pro dokončení klepněte na odkaz — potvrdíme, že nová adresa {{ .Email }} je opravdu vaše.

Potvrdit změnu: {{ .ConfirmationURL }}

Pokud jste o změnu nežádali, neklepejte na odkaz a napište nám na ahoj@vzpominkar.cz.
```

---

## 5. Invite user — _Invite user_ (optional, currently unused)

Vzpomínkář vytváří účty seniorů přes admin client (`createSeniorAccount`), takže Supabase pozvánky neposílá. Pokud někdy zapnete pozvánky pro spolusprávce rodiny, použijte stejný shell jako u Confirm signup, jen vyměňte H1 a tlačítko za:

```
Někdo vás pozval do rodiny ve Vzpomínkáři.
[Přijmout pozvání]
```

---

## Pasting tips

1. V dashboardu zaškrtněte **Subject** &amp; **Message** zvlášť pro každý template.
2. Supabase při uložení automaticky nahradí `{{ .ConfirmationURL }}`, `{{ .Email }}` a `{{ .Token }}` &mdash; nepoužívejte jiný formát placeholderu.
3. Náhled v dashboardu používá zástupné hodnoty &mdash; reálný odkaz uvidíte až v testovacím e-mailu (`Auth → Send a test email`).
4. Po pasteu vždy pošlete jeden test, ať vidíte, jak ho zobrazí Gmail / Outlook / Apple Mail.
