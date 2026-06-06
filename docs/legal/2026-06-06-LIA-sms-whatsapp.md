# Legitimate Interest Assessment (LIA) — SMS & WhatsApp weekly memory questions

**Controller:** Vzpomínkář, s. r. o.
**Date:** 2026-06-06
**Author / owner:** Vzpomínkář (product + legal)
**Status:** Active — review at least annually or on any material change to the processing.
**Scope:** Sending the weekly memory question to a *senior* (the storyteller) over **SMS** (via smsbrana s. r. o.) and **WhatsApp** (via Meta Platforms Ireland Ltd.), where the senior's phone number was provided by a **family buyer**, not by the senior directly.

---

## 0. Why an LIA (and not consent)

The weekly question is a **service message**, not marketing: it is the core of the product the family *paid for* — one prompt a week so their relative records a memory. The data subject for the phone number (the senior) is a **third party** whose number the **buyer** supplied. A buyer **cannot give GDPR consent on the senior's behalf** (consent must be the data subject's own, freely given, Art. 4(11) / Art. 7). Forcing "consent" here would be a fiction.

The honest and correct lawful basis for *sending* is **GDPR Art. 6(1)(f) — legitimate interest**. To rely on it we must pass the three-part test below (purpose / necessity / balancing) and, because the data was not obtained from the senior, satisfy the **Art. 14** notice obligation. This document is the accountability record under **Art. 5(2)**.

What the owner *does* provide at setup is an **attestation** (not consent): a checkbox stating they know the senior personally, have the senior's agreement to use the number, and have informed the senior we will send weekly questions there and how to stop. The exact wording is stored verbatim in `profiles.channel_attestation_text` with a `{sms|whatsapp}_attested_at` timestamp. The attestation is evidence supporting the balancing test; it is not the lawful basis.

---

## 1. Purpose test — is there a legitimate interest?

| Question | Assessment |
|---|---|
| **What is the interest?** | A family's interest in capturing and preserving the life stories of an ageing relative before they are lost, by nudging that relative with one gentle question a week; and the controller's interest in delivering the contracted service over the channel the family chose (some seniors do not use email). |
| **Whose interest?** | Primarily the **family / buyer's** legitimate interest (they initiated and paid for it); secondarily the controller's commercial interest in fulfilling the order; and arguably the **senior's own** interest — being remembered, sharing their story, staying connected with family. |
| **Is it legitimate, specific, real?** | Yes. It is a real, present, lawful interest, not speculative. The product exists precisely to serve it. It is **not** a marketing or profiling interest. |
| **Would a reasonable person see this as legitimate?** | Yes. "My daughter signed me up so I'd get a weekly question to record a memory" is a benign, easily understood, family-driven purpose. |

**Conclusion:** A valid legitimate interest exists.

---

## 2. Necessity test — is the processing necessary for that interest?

- **Is the processing needed to achieve the purpose?** Yes. To deliver a weekly question to the senior over SMS/WhatsApp we must process their phone number on that channel — there is no way to send a message without it.
- **Is there a less intrusive way?** The genuinely less intrusive channel — **email** — is offered first and is the default; SMS/WhatsApp are only used when the family explicitly chooses them (typically because the senior does not use email). So the more intrusive option is opt-in *by the family*, fallback-to-email is built into dispatch.
- **Is the data minimal?** Yes — see §4. We hold **only the name and a single phone number** for this purpose. No call logs, no contacts, no location, no marketing profile.
- **Is the channel proportionate?** One message per week (the family may pick weekly or fortnightly), strictly the question + a record link + the notice/opt-out link. No batching, no resend storms.

**Conclusion:** The processing is necessary and proportionate; the same purpose cannot reasonably be met with less data.

---

## 3. Balancing test — does the individual's interest override?

### 3.1 Nature of the data
Name + one mobile phone number. **No special-category data** (Art. 9). The *content* (the question) is non-sensitive and family-appropriate; the senior's eventual *answers* are stored under a separate basis (contract) and are not part of this SMS/WhatsApp processing.

### 3.2 Reasonable expectations
The senior was, per the owner's attestation, **told by their own family member** that these messages would come — so the messages should not be a surprise. The first message itself also links to a just-in-time Art. 14 notice. A person told by their child "you'll get a weekly question to record a memory" would reasonably expect exactly these messages.

### 3.3 Possible impact / risks to the data subject
- **Unwanted messages / intrusion.** Low volume (≈1/week) and immediately stoppable. Mitigated by the one-tap opt-out in *every* message.
- **Number provided without the senior's knowledge.** This is the main residual risk — we rely on the buyer's attestation, which could be false. Mitigated by (a) the just-in-time Art. 14 notice in the *first and every* message, which informs the senior directly regardless of what the buyer did, and (b) the instant opt-out, which lets the senior end it the moment they wish — they do not have to contact us or log in.
- **Cost to the senior.** Receiving SMS/WhatsApp is free for the recipient in CZ; no premium numbers.
- **Distress.** Content is gentle and reminiscence-oriented; no debt, health, or pressure framing.

### 3.4 Vulnerability of the data subject — flagged
The recipients are **elderly seniors**, who may be **more vulnerable** data subjects: less familiar with digital opt-out mechanics, potentially more susceptible to confusion or to feeling unable to refuse. The ICO/EDPB guidance specifically raises the balancing bar where vulnerable individuals are involved. We give this **extra weight against** the controller's interest, and answer it with stronger-than-usual safeguards (§3.5) — in particular an opt-out that needs **no account, no password, no reply, and no literacy with apps** beyond tapping one link, plus plain, large, reassuring Czech copy on the landing page.

### 3.5 Safeguards applied (these tip the balance)
1. **Just-in-time Art. 14 notice in every message** — a link ("Proč vám píšeme a jak se odhlásit") to `/odhlasit/{magic_token}?kanal=sms|whatsapp`, a page that states who we are, that a family member gave the number, why, the legal basis, and how to stop.
2. **One-tap opt-out, no login** — the landing records `{sms|whatsapp}_opt_out_at` and stops all further messages. No session is created, no password, no "reply STOP" (the CZ alphanumeric sender is one-way, so STOP cannot work — it must be a link).
3. **Strictly non-promotional content** — no upsell, no referral, no "visit our site", no "order now". A promotional payload would convert the message into a commercial communication needing opt-in; an automated test asserts the bodies contain the opt-out link and **no** promotional tokens.
4. **Data minimisation** — name + one number only.
5. **Email-first** — the less intrusive channel is the default; SMS/WhatsApp require a deliberate family choice, with automatic fallback to email if the channel is not live.
6. **Owner attestation on record** — accountability evidence (`channel_attestation_text` + `*_attested_at`) that the senior was informed by family.
7. **Frequency cap** — at most one message per week.
8. **Right to object honoured immediately** — the opt-out *is* the Art. 21 objection mechanism, satisfied in one tap.

### 3.6 Outcome of the balance
With email offered first, a minimal data footprint, a non-promotional low-frequency message the senior was told to expect by their own family, and — decisively for a potentially vulnerable subject — a frictionless, no-login, one-tap opt-out plus a just-in-time notice delivered *in the message itself*, the individual's interests and fundamental rights **do not override** the legitimate interests pursued. The safeguards specifically neutralise the two real risks (number given without knowledge; vulnerability) by putting control directly in the senior's hands at the first contact.

---

## 4. Data processed (minimisation record)

| Field | Source | Used for | Notes |
|---|---|---|---|
| `display_name` | Buyer | Personalising the notice | Not sent in the SMS/WhatsApp body content beyond the family context |
| `phone_e164` | Buyer | Addressing the message | Single number; E.164 |
| `channel_attestation_text` + `{sms,whatsapp}_attested_at` | Buyer (checkbox) | Accountability evidence | Attestation, not consent |
| `{sms,whatsapp}_opt_out_at` | Senior (one-tap) | Suppress further sends | Art. 21 objection record |

No location, contacts, device data, or marketing profile is processed for this purpose.

---

## 5. Processors / recipients

- **smsbrana s. r. o.** (CZ) — SMS delivery. EU. DPA in place.
- **Meta Platforms Ireland Ltd.** (WhatsApp) — message delivery; may process outside the EU (USA) under SCCs. DPA in place.

Only the phone number and the question text are shared, solely to deliver the message.

---

## 6. Art. 14 compliance (data not obtained from the data subject)

Because the number comes from the buyer, Art. 14 applies. We satisfy it via the **just-in-time notice** linked in the first (and every) message and the fuller "Otázky přes SMS a WhatsApp" section of `/soukromi`, covering: controller identity, source of the data (a family member), purpose, legal basis (legitimate interest), recipients (smsbrana, Meta/WhatsApp), retention, and the rights to object / opt out. The `/podminky` (terms) document does **not** pretend to discharge this notice — the notice is delivered to the senior directly.

---

## 7. Decision

**Legitimate interest under Art. 6(1)(f) is an appropriate and lawful basis** for sending the weekly memory question over SMS/WhatsApp, **subject to the safeguards in §3.5 remaining in place** — above all the in-message just-in-time Art. 14 notice and the no-login one-tap opt-out, which are the conditions on which the balance turns for a potentially vulnerable, elderly data subject.

**Review triggers:** adding a promotional element (would break the basis → needs consent); raising message frequency materially; processing additional senior data on this channel; a pattern of opt-outs or complaints suggesting the buyer attestations are unreliable; change of SMS/WhatsApp processor.
