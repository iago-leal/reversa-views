/**
 * The instant, turned into Brasília time (RF-15, RF-16, RN-09, D-15).
 *
 * One place converts, and one only. Header, checkpoint, trail and history all
 * read the same fact, and four conversions that agree today would eventually
 * disagree -- which in a panel means the same moment shown as two moments.
 *
 * The conversion is by the NAME of the zone, and not by subtracting three
 * hours. The offset has been constant since the country dropped daylight
 * saving in 2019, but a number written by hand keeps being right only until
 * the law changes, and then lies without anyone noticing. The name is what the
 * platform keeps up to date.
 *
 * The text is assembled from the PARTS of the formatter rather than from the
 * string it returns: `pt-BR` inserts a comma between date and time, and where
 * that comma sits is a decision of the locale, not of this project. Removing
 * it with an expression would be reading the locale's mind.
 *
 * The instant travels absolute and sortable and is converted only here, at the
 * point of presentation, which is what keeps it comparable everywhere else.
 *
 * SHARED PRESENTATION, since feature 014. This module used to serve the panel
 * alone; it now serves TWO surfaces -- the webview and the terminal tool of
 * `src/cli/` -- and it did not move for that. Moving the folder would have
 * touched every component, every suite and every delivered addendum without
 * changing one line of behaviour (D-14), so the change of status is declared
 * here and pinned by a suite: `tests/cli-boundaries.spec.ts` forbids a new
 * presentation rule from being born in `src/cli/quadro/`, and
 * `tests/cli-paridade.spec.tsx` compares what the two surfaces affirm over the
 * same payload. Drawing is what differs between them; deciding is not.
 * @module webview/domain/instants
 */

/** What the panel says when there is no instant to show (RF-13). */
export const INSTANT_ABSENT = 'momento não registrado'

/** How the panel names the zone, beside the converted text. */
const ZONE_LABEL = 'Brasília'

/** An instant turned readable, carrying the original beside it. */
export interface ReadableInstant {
  /** What to draw: the converted text, or the declaration of absence. */
  text: string
  /** The value as it arrived, for the consultable attribute of RF-16. */
  raw: string
  /** False when there was no instant to convert. */
  known: boolean
}

/**
 * The formatter, built once and kept.
 *
 * It is built lazily and inside a try, because an environment without a
 * complete zone database would throw on construction. Where that happens the
 * panel falls back to the original text rather than to nothing: a raw instant
 * is worse than a converted one and better than a blank.
 */
let formatter: Intl.DateTimeFormat | null | undefined

/**
 * The formatter for São Paulo time, or null where the environment has no zone
 * database to build it from.
 * @returns the formatter, or null.
 */
function brasiliaFormatter(): Intl.DateTimeFormat | null {
  if (formatter === undefined) {
    try {
      formatter = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      })
    } catch {
      formatter = null
    }
  }
  return formatter
}

/**
 * Assemble the text from the parts, so that the shape is this project's and
 * not the locale's.
 * @param parts - what the formatter produced.
 * @returns the text, or null when a part the shape needs is missing.
 */
function compose(parts: Intl.DateTimeFormatPart[]): string | null {
  const found: Record<string, string> = {}
  for (const part of parts) found[part.type] = part.value

  const { day, month, year, hour, minute } = found
  if (day === undefined || month === undefined || year === undefined) return null
  if (hour === undefined || minute === undefined) return null

  return `${day}/${month}/${year} ${hour}:${minute} (${ZONE_LABEL})`
}

/**
 * Turn an absolute instant into Brasília time.
 *
 * Total for every input: absence, empty text, a value that is not text and a
 * text that is not an instant all come back declared absent rather than as an
 * invalid date or a blank field.
 * @param value - the instant as REVERSA wrote it, or the absence of one.
 * @returns the readable instant, with the original beside it.
 */
export function brasiliaInstant(value: string | null | undefined): ReadableInstant {
  if (typeof value !== 'string' || value.trim() === '') {
    return { text: INSTANT_ABSENT, raw: '', known: false }
  }

  const moment = new Date(value)
  if (Number.isNaN(moment.getTime())) {
    // Text that is not an instant: the original is kept, so that whoever
    // inspects the element still sees what the file held.
    return { text: INSTANT_ABSENT, raw: value, known: false }
  }

  const format = brasiliaFormatter()
  if (format === null) return { text: value, raw: value, known: true }

  try {
    const text = compose(format.formatToParts(moment))
    return text === null
      ? { text: value, raw: value, known: true }
      : { text, raw: value, known: true }
  } catch {
    return { text: value, raw: value, known: true }
  }
}

/* ------------------------------------------------------- a data do registro */

/** What the panel says when there is no date to show (RF-13, RN-06). */
export const DATE_ABSENT = 'data não registrada'

/** The form the registry writes a date in: a day, and never an instant. */
const DAY = /^(\d{4})-(\d{2})-(\d{2})$/

/** The widest month and the widest day any calendar has. */
const LAST_MONTH = 12
const LAST_DAY = 31

/**
 * A date of the bug registry, reformatted WITHOUT building a `Date` and without
 * touching a time zone (RN-06, D-05).
 *
 * The sister of `brasiliaInstant`, and its opposite in exactly one respect: it
 * converts nothing. The reason is a trap that would fail in silence.
 * `new Date('2026-09-10')` is midnight in universal time, and converted to
 * Brasília it reads as the ninth: every date of the registry would be drawn one
 * day behind, with no exception, no anomaly and nothing on screen to say
 * anything was wrong. RN-06 already states that a zone conversion does not
 * apply to a value with no clock in it; this function is what makes the code
 * agree with the rule.
 *
 * So the day, the month and the year are the three groups of the value itself,
 * reordered. A value that is not a date comes back declared absent, with the
 * original beside it, rather than as a blank field or an invalid date. That
 * includes a day that passes the form and does not exist -- the thirtieth of
 * February -- which is drawn as it was written, because a reader that
 * normalised it would show a day the file does not hold.
 *
 * It lives in THIS module, beside the conversion it deliberately is not,
 * because the note that one place converts is only useful where the reason for
 * a second function is visible next to it.
 * @param value - the date as the registry wrote it, or the absence of one.
 * @returns the readable date, with the original beside it.
 */
export function readableDate(value: string | null | undefined): ReadableInstant {
  if (typeof value !== 'string' || value.trim() === '') {
    return { text: DATE_ABSENT, raw: '', known: false }
  }

  const day = DAY.exec(value.trim())
  if (day === null) return { text: DATE_ABSENT, raw: value, known: false }

  const [, year, month, date] = day
  // The ranges are checked LEXICALLY, which is where the line is drawn between
  // a value that is not a date and one the calendar happens not to have. A
  // thirteenth month is not a date and is declared absent; the thirtieth of
  // February passes, because telling THAT apart would take building a `Date`,
  // and a `Date` would normalise it into the second of March -- drawing a day
  // the file does not hold, which is worse than repeating one it does.
  if (Number(month) < 1 || Number(month) > LAST_MONTH) {
    return { text: DATE_ABSENT, raw: value, known: false }
  }
  if (Number(date) < 1 || Number(date) > LAST_DAY) {
    return { text: DATE_ABSENT, raw: value, known: false }
  }

  return { text: `${date}/${month}/${year}`, raw: value, known: true }
}
