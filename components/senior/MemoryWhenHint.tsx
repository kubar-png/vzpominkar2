/**
 * Soft hint shown above the recording / writing UI on every
 * /new-memory/* page. Nudges the recorder to mention a year or period
 * in their narration so the AI extractor can stamp the memory with a
 * temporal anchor — without forcing them to fill a date field.
 *
 * Senior-surface scope (.editorial-senior), so the type is generous and
 * the contrast is high.
 */
export function MemoryWhenHint() {
  return (
    <aside
      role="note"
      className="es-when-hint"
      aria-label="Tip pro vyprávění"
    >
      <span className="es-when-hint-icon" aria-hidden>
        ✦
      </span>
      <p>
        <strong>Drobný tip:</strong> až budete vyprávět, zkuste zmínit
        rok nebo období — třeba „v létě 1973“ nebo „když mi bylo deset“.
        Nemusíte přesně, stačí přibližně.
      </p>
    </aside>
  );
}
