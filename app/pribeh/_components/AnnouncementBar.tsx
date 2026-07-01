import { ANNOUNCEMENTS } from "../_data/site";

/* Sticky-feel one-line rotating announcement bar. Pure CSS rotation (no JS) —
 * the track steps through each message. Messages may contain <b> emphasis. */
export function AnnouncementBar() {
  return (
    <div className="pl-announce" role="region" aria-label="Aktuální nabídky">
      <div className="pl-announce__viewport">
        <div className="pl-announce__track">
          {ANNOUNCEMENTS.map((msg, i) => (
            <div className="pl-announce__item" key={i} dangerouslySetInnerHTML={{ __html: msg }} />
          ))}
        </div>
      </div>
    </div>
  );
}
