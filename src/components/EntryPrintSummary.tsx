import type { Mapping } from "../types";
import { EMOTION_PLACES_BY_ID } from "../data";

/**
 * Plain-text summary block that surfaces every set lens field. Hidden in
 * the interactive view (`hidden`) and shown only at print time
 * (`print:block`). Kept at the EntrySection level so each printed entry
 * carries its own ledger of derived values alongside the editorial card.
 */
export const EntryPrintSummary = ({ entry }: { entry: Mapping }) => (
  <div className="hidden print:block text-[11px] text-[#5A3645] pt-3 mt-2 border-t border-gray-100 space-y-1 font-serif">
    {entry.workability ? <div>Workability: {entry.workability}/5</div> : null}
    {entry.emotionCluster ? (
      <div>
        Atlas of the Heart: {entry.emotion ? `${entry.emotion} · ` : ""}
        {EMOTION_PLACES_BY_ID[entry.emotionCluster]?.label}
      </div>
    ) : null}
    {entry.coreNeed ? <div>Core need: {entry.coreNeed}</div> : null}
    {entry.lifeDesign?.wayfinding?.engagement ||
    entry.lifeDesign?.wayfinding?.energy ? (
      <div>
        Wayfinding ·
        {entry.lifeDesign.wayfinding?.engagement
          ? ` engagement ${entry.lifeDesign.wayfinding.engagement}/5`
          : ""}
        {entry.lifeDesign.wayfinding?.engagement &&
        entry.lifeDesign.wayfinding?.energy
          ? " ·"
          : ""}
        {entry.lifeDesign.wayfinding?.energy
          ? ` energy ${entry.lifeDesign.wayfinding.energy}/5`
          : ""}
      </div>
    ) : null}
    {entry.lifeDesign?.problemFrame ? (
      <div>Problem type: {entry.lifeDesign.problemFrame}</div>
    ) : null}
    {entry.lifeDesign?.problemFrame !== "reality" &&
    entry.lifeDesign?.reframeNote?.trim() ? (
      <div>Reframe: {entry.lifeDesign.reframeNote}</div>
    ) : null}
    {entry.lifeDesign?.problemFrame === "reality" &&
    entry.lifeDesign?.acceptanceNote?.trim() ? (
      <div>Acceptance: {entry.lifeDesign.acceptanceNote}</div>
    ) : null}
    {entry.lifeDesign?.problemFrame !== "reality" &&
    entry.lifeDesign?.prototype?.action?.trim() ? (
      <div>
        Prototype ({entry.lifeDesign.prototype.mode ?? "do"}):{" "}
        {entry.lifeDesign.prototype.action}
      </div>
    ) : null}
    {entry.accelerators ? <div>Accelerators: {entry.accelerators}</div> : null}
    {entry.brakes ? <div>Brakes: {entry.brakes}</div> : null}
    {entry.relational?.active && entry.relational.source ? (
      <div>
        Relational source: {entry.relational.source.replace("_", " ")}
        {(() => {
          const r = entry.relational!;
          const checks = [
            r.focusSelf,
            r.intentValue,
            r.isRequest,
            r.preservesAutonomy,
          ];
          const checked = checks.filter((c) => c === true).length;
          const total = checks.filter((c) => c !== undefined).length;
          if (total === 0) return null;
          return ` · boundary ${checked}/4 (${
            checked === 4 ? "clean" : "overreaching"
          })`;
        })()}
      </div>
    ) : null}
  </div>
);
