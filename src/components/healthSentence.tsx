import React from "react";

const PINK = "#C24E6E";
const SAGE = "#5C7F66";

const WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

const numWord = (n: number): string => {
  if (n === 0) return "none";
  return WORDS[n] ?? String(n);
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const isAre = (n: number) => (n === 1 ? "is" : "are");

// Dynamic narration of the workability distribution. Returns a JSX fragment
// so we can color the count spans inline. Pure — no state, no side effects.
//
// Buckets:
//   stuck   = workability 1
//   mixed   = workability 2 or 3 ("in between" in copy)
//   working = workability 4 or 5
//   unrated = total - stuck - mixed - working
export const healthSentence = (
  total: number,
  stuck: number,
  mixed: number,
  working: number,
): React.ReactNode => {
  const unrated = Math.max(0, total - stuck - mixed - working);

  if (total === 0) return <span>Nothing mapped yet.</span>;

  if (total === 1) {
    const where =
      stuck === 1 ? (
        <>
          and it's <span style={{ color: PINK }}>stuck</span>
        </>
      ) : working === 1 ? (
        <>
          and it's <span style={{ color: SAGE }}>working</span>
        </>
      ) : mixed === 1 ? (
        <>currently in between</>
      ) : (
        <>not yet rated</>
      );
    return <>One value mapped, {where}.</>;
  }

  if (stuck === total)
    return (
      <>
        {cap(numWord(total))} values mapped.{" "}
        <span style={{ color: PINK }}>All stuck</span>.
      </>
    );
  if (working === total)
    return (
      <>
        {cap(numWord(total))} values mapped.{" "}
        <span style={{ color: SAGE }}>All working</span>.
      </>
    );
  if (mixed === total)
    return <>{cap(numWord(total))} values mapped. All in between.</>;
  if (unrated === total)
    return <>{cap(numWord(total))} values mapped. None rated yet.</>;

  // Build clauses in priority order (extremes first, then middle, then unrated).
  // Always explicit — no "the rest are" shortcut, since with four possible
  // buckets the reader can't infer which one is "the rest".
  const clauses: React.ReactNode[] = [];
  if (stuck > 0) {
    clauses.push(
      <span key="s" style={{ color: PINK }}>
        {numWord(stuck)} {isAre(stuck)} stuck
      </span>,
    );
  }
  if (working > 0) {
    clauses.push(
      <span key="w" style={{ color: SAGE }}>
        {numWord(working)} {isAre(working)} working
      </span>,
    );
  }
  if (mixed > 0) {
    clauses.push(
      <span key="m">
        {numWord(mixed)} {isAre(mixed)} in between
      </span>,
    );
  }
  if (unrated > 0) {
    clauses.push(<span key="u">{numWord(unrated)} not yet rated</span>);
  }

  const joined = clauses.flatMap((c, i) => (i === 0 ? [c] : [", ", c]));
  return (
    <>
      {cap(numWord(total))} values mapped.{" "}
      {joined.map((n, i) => (
        <React.Fragment key={i}>{n}</React.Fragment>
      ))}
      .
    </>
  );
};
