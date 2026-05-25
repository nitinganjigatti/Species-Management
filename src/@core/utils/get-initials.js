// ** Returns initials from string.
// Strips parenthesized decorations (e.g. "Anil Rathod (You)" → "AR" instead
// of "AR(") because those almost always represent role/status tags rather
// than name parts. Also filters empty tokens so trailing/duplicate spaces
// don't add stray characters.
export const getInitials = string =>
  string
    .replace(/\s*\(.*?\)\s*/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .reduce((response, word) => (response += word.slice(0, 1)), '')
    .toUpperCase()
