// The reason the app exists. Not "how am I feeling about this" but the
// structural read: what is met, by how many people, and what is a floor that
// nobody is meeting.
//
// It opens with a sentence rather than a grid of numbers, because a dashboard
// is the wrong register for a page about the people in your life — and because
// a counted stat labelled "needs you haven't asked about" reads as an
// accusation rather than an observation.

import React from 'react';
import type { Arrangement, Need, Person } from '../types';
import { concentration, deriveCoverage, givenCount } from '../derive';
import { Figure, Label, Row, StatusNote } from './primitives';
import { RingPair } from './rings';

const plural = (n: number, one: string, many: string): string =>
  `${n} ${n === 1 ? one : many}`;

/** The whole read, in one sentence. */
const summarise = (
  total: number, met: number, given: number, floorsAtRisk: number,
): React.ReactNode => {
  if (total === 0) return 'Nothing mapped yet.';
  const metPart =
    met === 0 ? 'None are met yet'
    : met === total ? (total === 1 ? 'It is met' : 'All of them are met')
    : met === 1 ? '1 of them is met'
    : `${met} of them are met`;
  return (
    <>
      {plural(total, 'need', 'needs')}. {metPart}
      {given > 0 && (
        <> — <span className="text-rose">{given}</span> without anyone being asked</>
      )}
      .{' '}
      {floorsAtRisk > 0 && (
        <span className="text-rose">
          {plural(floorsAtRisk, 'non-negotiable is', 'non-negotiables are')} not.
        </span>
      )}
    </>
  );
};

export const CoverageView = ({
  needs, arrangements, people,
}: {
  needs: Need[];
  arrangements: Arrangement[];
  people: Person[];
}) => {
  const coverage = deriveCoverage(needs, arrangements, people);
  const spread = concentration(coverage);
  const met = coverage.needs.length - coverage.unmet;
  const given = givenCount(coverage);

  if (needs.length === 0) {
    return (
      <p className="py-10 font-serif text-lg leading-relaxed text-mauve italic">
        Add a need or two and this fills in.
      </p>
    );
  }

  return (
    <div>
      <div className="border-b border-ink/8 pb-7">
        <Label>How it stands</Label>
        <p className="mt-2 font-serif text-2xl leading-snug text-ink">
          {summarise(coverage.needs.length, met, given, coverage.floorsAtRisk)}
        </p>
      </div>

      <div className="flex flex-wrap gap-x-10 gap-y-6 border-b border-ink/8 py-6">
        <Figure
          label="resting on one person"
          value={String(coverage.singleSource)}
          tone={coverage.singleSource > 0 ? 'ink' : 'mauve'}
        />
        <Figure
          label="carried by whoever carries most"
          value={spread === undefined ? '—' : `${Math.round(spread * 100)}%`}
          tone={spread !== undefined && spread === 1 ? 'rose' : 'ink'}
        />
        <Figure label="met without asking" value={String(given)} tone="ink" />
      </div>

      {coverage.people.length > 0 && (
        <Row>
          <Label>Who carries what</Label>
          <ul className="mt-3 space-y-3">
            {coverage.people.map(({ person, meets, soleSourceFor }) => (
              <li key={person.id} className="flex items-baseline justify-between gap-4">
                <div className="flex min-w-0 items-baseline gap-2">
                  <RingPair size={16} stroke={0.13} />
                  <span className="font-serif text-xl text-ink">{person.name}</span>
                  <span className="font-mono text-[9px] tracking-[0.16em] text-mauve uppercase">
                    {person.context}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-serif text-lg text-ink">
                    {plural(meets, 'need', 'needs')}
                  </div>
                  {soleSourceFor > 0 && (
                    <div className="font-serif text-sm text-rose italic">
                      only source for {soleSourceFor}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Row>
      )}

      <Row>
        <Label>Every need</Label>
        <ul className="mt-3 space-y-3.5">
          {coverage.needs.map((c) => (
            <li key={c.need.id} className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-serif text-lg leading-snug text-ink">
                  {c.need.statement}
                </div>
                <div className="mt-0.5 font-sans text-[13px] text-mauve">
                  {c.metPeople.length > 0
                    ? `${c.metPeople
                        .map((id) => people.find((p) => p.id === id)?.name ?? 'someone')
                        .join(', ')}${c.givenBy.length > 0 ? ' · unasked' : ''}`
                    : c.status === 'waiting'
                      ? 'asked, waiting to hear'
                      : c.status === 'declined'
                        ? 'told no'
                        : 'no one, yet'}
                </div>
              </div>
              <StatusNote status={c.status} />
            </li>
          ))}
        </ul>
      </Row>
    </div>
  );
};
