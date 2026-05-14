import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Mapping } from "../types";
import { EMOTION_PLACES_BY_ID, findEmotion } from "../data";
import { lensCompletion } from "../derive";
import { CompletionBar } from "./primitives";
import { LensPanel } from "./LensPanel";

// --- Bloom C+ SVG Primitives ----------------------------------------------

const BloomFlower = ({
  size = 20,
  petal = "#E07A95",
  eye = "#3A1E2A",
  smile = true,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="inline-block align-middle overflow-visible"
  >
    {Array.from({ length: 5 }).map((_, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill={petal}
        opacity="0.95"
        stroke="#C24E6E"
        strokeOpacity="0.2"
        transform={`rotate(${(i * 360) / 5} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#C24E6E" opacity="0.9" />
    <circle cx="50" cy="50" r="3" fill="#F7D679" />
    {smile && (
      <g>
        <circle cx="44" cy="48" r="1.6" fill={eye} />
        <circle cx="52" cy="48" r="1.6" fill={eye} />
        <path
          d="M44 53 Q48 56 52 53"
          stroke="#3A1E2A"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      </g>
    )}
  </svg>
);

const BrakeMark = ({ size = 12 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    className="inline-block align-middle"
  >
    {[0, 72, 144, 216].map((a, i) => (
      <path
        key={i}
        d="M50 50 C 28 38, 22 12, 50 4 C 78 12, 72 38, 50 50 Z"
        fill="#B391A0"
        opacity="0.55"
        transform={`rotate(${a} 50 50)`}
      />
    ))}
    <circle cx="50" cy="50" r="9" fill="#5A3645" opacity="0.6" />
    <circle cx="50" cy="50" r="3" fill="#F7D679" opacity="0.7" />
  </svg>
);

const BloomWorkability = ({
  value = 0,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => (
  <span className="inline-flex gap-1 items-center bg-[#FAE6E1]/50 px-2 py-1 rounded-full border border-[#3A1E2A]/5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className="focus:outline-none hover:scale-110 transition-transform"
        title={`Rate workability ${n}/5`}
      >
        <BloomFlower
          size={16}
          petal={n <= value ? "#E07A95" : "#FBD9E0"}
          eye={n <= value ? "#3A1E2A" : "#B391A0"}
          smile={n <= value}
        />
      </button>
    ))}
  </span>
);

const parseCompositeNeed = (raw: string) => {
  if (!raw)
    return {
      core: "",
      reframe: "",
      prototype: "",
      accelerators: "",
      brakes: "",
    };

  let current = raw;

  // Extract Brakes
  let brakes = "";
  const brakesIdx = current.match(/Brakes to watch:\s*/i);
  if (brakesIdx && brakesIdx.index !== undefined) {
    brakes = current.slice(brakesIdx.index + brakesIdx[0].length).trim();
    current = current.slice(0, brakesIdx.index).trim();
  }

  // Extract Accelerators
  let accelerators = "";
  const accIdx = current.match(/Accelerators:\s*/i);
  if (accIdx && accIdx.index !== undefined) {
    accelerators = current.slice(accIdx.index + accIdx[0].length).trim();
    current = current.slice(0, accIdx.index).trim();
  }

  // Extract Prototype
  let prototype = "";
  const protoIdx = current.match(/Prototype\s*(\([^)]*\))?:\s*/i);
  if (protoIdx && protoIdx.index !== undefined) {
    prototype = current.slice(protoIdx.index + protoIdx[0].length).trim();
    current = current.slice(0, protoIdx.index).trim();
  }

  // Extract Reframe
  let reframe = "";
  const refIdx = current.match(/Reframe:\s*/i);
  if (refIdx && refIdx.index !== undefined) {
    reframe = current.slice(refIdx.index + refIdx[0].length).trim();
    current = current.slice(0, refIdx.index).trim();
  }

  return {
    core: current.trim(),
    reframe,
    prototype,
    accelerators,
    brakes,
  };
};
// --- Component Props ------------------------------------------------------

interface EntryProps {
  entry: Mapping;
  isDuplicate: boolean;
  lensOpen: boolean;
  onToggleLens: () => void;
  onChange: (patch: Partial<Mapping>) => void;
  onDelete: () => void;
  onToggleNvc: (need: string) => void;
  onFocus: () => void;
}

export const EntrySection = ({
  entry,
  isDuplicate,
  lensOpen,
  onToggleLens,
  onChange,
  onDelete,
  onToggleNvc,
  onFocus,
}: EntryProps) => {
  // Drives the transition between Version A (condensed row) and Version B (expanded card)
  const [isExpanded, setIsExpanded] = useState(() => {
    // If it's a brand new blank entry, default to expanded so you can write
    return !entry.value.trim() && !entry.need.trim();
  });

 const completion = lensCompletion(entry);

 // Safe split parsing for derived pill counts
 const acceleratorsCount = entry.accelerators
   ? entry.accelerators.split(",").filter((s) => s.trim()).length
   : 0;
 const brakesCount = entry.brakes
   ? entry.brakes.split(",").filter((s) => s.trim()).length
   : 0;
 const servesDriver = entry.coreNeed
   ? entry.coreNeed.toLowerCase()
   : "unmapped";

 // --- SMART AUTO-PARSER FOR MASSIVE COMPOSITE STRINGS ---
 // Safely extracts labeled subsections from legacy pasted text on the fly
 const parsedNeed = (() => {
   const raw = entry.need || "";
   let current = raw;

   let brakes = "";
   const bMatch = current.match(/Brakes to watch:\s*/i);
   if (bMatch && bMatch.index !== undefined) {
     brakes = current.slice(bMatch.index + bMatch[0].length).trim();
     current = current.slice(0, bMatch.index).trim();
   }

   let accelerators = "";
   const aMatch = current.match(/Accelerators:\s*/i);
   if (aMatch && aMatch.index !== undefined) {
     accelerators = current.slice(aMatch.index + aMatch[0].length).trim();
     current = current.slice(0, aMatch.index).trim();
   }

   let prototype = "";
   const pMatch = current.match(/Prototype\s*(\([^)]*\))?:\s*/i);
   if (pMatch && pMatch.index !== undefined) {
     prototype = current.slice(pMatch.index + pMatch[0].length).trim();
     current = current.slice(0, pMatch.index).trim();
   }

   let reframe = "";
   const rMatch = current.match(/Reframe:\s*/i);
   if (rMatch && rMatch.index !== undefined) {
     reframe = current.slice(rMatch.index + rMatch[0].length).trim();
     current = current.slice(0, rMatch.index).trim();
   }

   return {
     core: current.trim(),
     reframe,
     prototype,
     accelerators,
     brakes,
     hasExtracted: !!(reframe || prototype || accelerators || brakes),
   };
 })();

 // Dynamically scale the edit canvas height based on raw character length
 const dynamicRows = Math.min(
   12,
   Math.max(3, Math.ceil((entry.need || "").length / 65)),
 );

 return (
   <section className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 print:mb-8 select-none">
     {/* Delete trigger */}
     <button
       onClick={onDelete}
       className="absolute -left-12 top-2 bg-white border border-[#3A1E2A]/10 p-1.5 rounded-full text-[#B391A0] hover:text-[#C24E6E] hover:border-[#C24E6E]/30 opacity-0 group-hover:opacity-100 transition-all print:hidden z-10 shadow-xs cursor-pointer"
       title="Remove mapped value"
     >
       <Trash2 size={14} />
     </button>

     {/* --- VERSION A: CONDENSED SCAN ROW (Default State) --- */}
     {!isExpanded ? (
       <div className="bg-[#FFFFFF] rounded-[18px] border border-[#3A1E2A]/10 p-4 sm:p-5 hover:border-[#E07A95]/40 transition-colors shadow-xs">
         <div className="flex items-baseline gap-3 mb-2">
           <BloomFlower size={16} petal="#E07A95" smile={false} />
           <input
             className="font-serif text-xl sm:text-2xl text-[#3A1E2A] bg-transparent focus:outline-none placeholder:text-[#B391A0]/50 flex-1 cursor-pointer select-none"
             value={entry.value}
             onChange={(e) => onChange({ value: e.target.value })}
             onClick={() => setIsExpanded(true)}
             placeholder="Core Value ✿"
             readOnly
           />
           <BloomWorkability
             value={entry.workability ?? 0}
             onChange={(n) => onChange({ workability: n })}
           />
         </div>

         <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-4 sm:gap-6 pt-1 items-start">
           {/* Scannable Friction summary */}
           <div
             onClick={() => setIsExpanded(true)}
             className="cursor-pointer group/col"
           >
             <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#B391A0] font-semibold mb-1">
               Friction
             </div>
             <p className="text-xs text-[#5A3645] leading-relaxed line-clamp-2 group-hover/col:text-[#3A1E2A]">
               {entry.friction || (
                 <span className="text-[#B391A0]/60 italic">
                   nothing in the way today ✿
                 </span>
               )}
             </p>
           </div>

           {/* Scannable Need & Treatment 3 Graceful Fade Indicator */}
           <div
             onClick={() => setIsExpanded(true)}
             className="cursor-pointer group/col flex flex-col justify-between h-full"
           >
             <div>
               <div className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold mb-1 flex items-center gap-1">
                 Need
                 <span className="text-[#B391A0] font-normal lowercase tracking-normal">
                   · serves {servesDriver}
                 </span>
               </div>

               {/* Renders clean extracted core statement directly */}
               <p className="font-serif italic text-sm text-[#3A1E2A] leading-relaxed line-clamp-2 group-hover/col:text-[#C24E6E]">
                 {parsedNeed.core || entry.need || (
                   <span className="text-[#B391A0]/60 not-italic font-sans">
                     Click to start drafting…
                   </span>
                 )}
               </p>
             </div>

             {/* Smart indicator pill that un-clips long content */}
             {(entry.need || "").length > 120 && (
               <div className="mt-2 inline-flex items-center gap-1 bg-[#FBD9E0]/40 text-[#C24E6E] px-2.5 py-1 rounded-full font-sans text-[10px] font-medium self-start group-hover/col:bg-[#FBD9E0]">
                 <BloomFlower size={10} petal="#E07A95" smile={false} />
                 <span>
                   Expand to read the full Need ↓
                 </span>
               </div>
             )}

             {/* Status pill strip */}
             <div className="mt-3 flex items-center gap-2 flex-wrap font-mono text-[9px] text-[#B391A0] tracking-wider pt-2 border-t border-[#3A1E2A]/5">
               {(acceleratorsCount > 0 || parsedNeed.accelerators) && (
                 <span className="text-[#C24E6E] bg-[#FBD9E0]/50 px-2 py-0.5 rounded-full">
                   {parsedNeed.accelerators
                     ? "✿ accelerators extracted"
                     : `${acceleratorsCount} accelerators`}
                 </span>
               )}
               {(brakesCount > 0 || parsedNeed.brakes) && (
                 <span className="bg-[#FAE6E1] text-[#5A3645] px-2 py-0.5 rounded-full">
                   {parsedNeed.brakes
                     ? "⚠ brakes extracted"
                     : `${brakesCount} brakes`}
                 </span>
               )}
               {(entry.lifeDesign?.reframeNote?.trim() ||
                 parsedNeed.reframe) && (
                 <span className="text-[#9CD3B6] font-bold">reframe ✓</span>
               )}
               {(entry.lifeDesign?.prototype?.action?.trim() ||
                 parsedNeed.prototype) && (
                 <span className="text-[#9CD3B6] font-bold">prototype ✓</span>
               )}
               {entry.relational?.active && (
                 <span
                   className={`px-2 py-0.5 rounded-full ${entry.relational.source ? "bg-[#FFF5DC] text-[#5A3645]" : "bg-red-50 text-[#C24E6E]"}`}
                 >
                   relational ✿
                 </span>
               )}
               <span className="ml-auto text-[#C24E6E] font-sans text-[10px] tracking-normal font-medium group-hover:underline">
                 expand ↓
               </span>
             </div>
           </div>
         </div>
       </div>
     ) : (
       /* --- VERSION B: EXPANDED MURAKAMI CANVAS (Active Edit State) --- */
       <div className="bg-[#FFFFFF] rounded-[18px] border border-[#3A1E2A]/15 p-6 shadow-sm transition-all">
         {/* Header Row */}
         <div className="flex items-baseline gap-3 pb-4 mb-5 border-b border-dashed border-[#3A1E2A]/10">
           <BloomFlower size={20} petal="#E07A95" />
           <input
             className="font-serif text-2xl sm:text-3xl text-[#3A1E2A] bg-transparent focus:outline-none placeholder:text-[#B391A0]/50 flex-1"
             value={entry.value}
             onChange={(e) => onChange({ value: e.target.value })}
             placeholder="Name this core value..."
           />
           <BloomWorkability
             value={entry.workability ?? 0}
             onChange={(n) => onChange({ workability: n })}
           />
         </div>

         {isDuplicate && (
           <p className="-mt-3 mb-4 text-[10px] uppercase tracking-[0.2em] text-red-500 bg-red-50 p-2 rounded-lg print:hidden">
             ✿ Duplicate detected — values must carry unique names to index
             properly.
           </p>
         )}

         {/* Main Murakami Grid Canvas */}
         <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 sm:gap-8 items-start">
           {/* LEFT COLUMN: Friction + Accountability Block */}
           <div className="flex flex-col gap-5">
             <div>
               <label className="text-[9.5px] uppercase tracking-[0.18em] text-[#5A3645] font-semibold block mb-1">
                 The friction
               </label>
               <textarea
                 className="w-full bg-transparent focus:outline-none text-xs sm:text-sm text-[#5A3645] leading-relaxed resize-none placeholder:text-[#B391A0]/40 border border-transparent focus:border-[#FAE6E1] rounded-lg p-1 -ml-1"
                 value={entry.friction}
                 onChange={(e) => onChange({ friction: e.target.value })}
                 placeholder="What feels sticky or exhausting right now?"
                 rows={3}
               />

               {/* Step 0: Atlas Granularity Diagnostic Feed */}
               {entry.emotionCluster &&
                 (() => {
                   const place = EMOTION_PLACES_BY_ID[entry.emotionCluster];
                   const emo = findEmotion(entry.emotionCluster, entry.emotion);
                   const cessation = !!emo?.cessation;
                   return (
                     <div className="mt-1 bg-[#FDF4F0] p-2 rounded-lg border border-[#3A1E2A]/5">
                       <p
                         className={`text-[11px] italic ${cessation ? "text-amber-700 font-medium" : "text-[#C24E6E]"}`}
                       >
                         {cessation ? "⚠️ Pause here · " : "✿ Closest match · "}
                         {entry.emotion
                           ? `${entry.emotion.toLowerCase()} · `
                           : ""}
                         <span className="text-[#5A3645] not-italic font-sans text-[10px] block mt-0.5">
                           {place?.label}
                         </span>
                       </p>
                     </div>
                   );
                 })()}
             </div>

             {/* Sander T. Jones Accountability Debugger Canvas */}
             {entry.relational?.active && (
               <div className="bg-[#FAE6E1]/30 p-3.5 rounded-xl border border-dashed border-[#C24E6E]/30">
                 <div className="flex items-center gap-1.5 mb-2">
                   <BloomFlower size={12} petal="#C24E6E" smile={false} />
                   <span className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold">
                     Accountability
                   </span>
                 </div>

                 {entry.relational.source && (
                   <p className="font-serif italic text-xs text-[#3A1E2A] mb-3 pb-2 border-b border-[#3A1E2A]/5 capitalize">
                     Source: {entry.relational.source.replace("_", " ")}
                   </p>
                 )}

                 {(() => {
                   const r = entry.relational;
                   const checks = [
                     r.focusSelf,
                     r.intentValue,
                     r.isRequest,
                     r.preservesAutonomy,
                   ];
                   const passed = checks.filter((c) => c === true).length;
                   const isEvaluated = checks.some((c) => c !== undefined);

                   return (
                     <div>
                       <div className="flex justify-between items-center mb-1 font-mono text-[9px] text-[#5A3645]">
                         <span>Stress Test</span>
                         <span
                           className={
                             passed === 4
                               ? "text-[#9CD3B6] font-bold"
                               : "text-[#C24E6E]"
                           }
                         >
                           {isEvaluated ? `${passed}/4 passed` : "pending"}
                         </span>
                       </div>
                       <div className="text-[10px] text-[#5A3645] font-mono tracking-tighter bg-white/80 p-2 rounded border border-[#3A1E2A]/5">
                         {passed === 4 ? (
                           <span className="text-[#1F6E4A] font-sans font-medium">
                             ✨ Clean boundary statement. Zero coercive demands
                             leaking out.
                           </span>
                         ) : (
                           <span className="text-[#C24E6E] font-sans italic">
                             ⚠️ Unvetted Rule: Intercepting demand. Adjust
                             reframe to honor autonomy.
                           </span>
                         )}
                       </div>
                     </div>
                   );
                 })()}
               </div>
             )}
           </div>

           {/* RIGHT COLUMN: Need Manifesto & Design Constraints */}
           <div className="flex flex-col gap-4">
             {/* Primary Need block (Auto-expands based on raw character length) */}
             <div>
               <div className="flex items-center gap-1.5 mb-1">
                 <BloomFlower size={12} petal="#C24E6E" smile={false} />
                 <label className="text-[9.5px] uppercase tracking-[0.18em] text-[#C24E6E] font-semibold block">
                   The need manifesto
                 </label>
               </div>

               <textarea
                 className="w-full bg-transparent focus:outline-none font-serif italic text-base sm:text-lg text-[#3A1E2A] leading-relaxed resize-none placeholder:text-[#B391A0]/40 border border-transparent focus:border-[#FAE6E1] rounded-lg p-1 -ml-1 custom-scrollbar"
                 value={entry.need}
                 onChange={(e) => onChange({ need: e.target.value })}
                 placeholder="To honor this value, I non-negotiably require..."
                 rows={dynamicRows}
               />

               {/* NVC tags rendered as Murakami candy pills */}
               {entry.nvcNeeds && entry.nvcNeeds.length > 0 && (
                 <div className="flex flex-wrap gap-1.5 pt-1">
                   {entry.nvcNeeds.map((n) => (
                     <span
                       key={n}
                       className="font-sans text-[11px] bg-[#FBD9E0] text-[#C24E6E] px-2.5 py-0.5 rounded-full"
                     >
                       {n}
                     </span>
                   ))}
                 </div>
               )}

               {/* Serves footer */}
               <div className="mt-2.5 flex items-baseline gap-2 font-sans text-xs text-[#B391A0]">
                 <span className="text-[8.5px] uppercase tracking-[0.18em] font-bold text-[#5A3645]">
                   serves →
                 </span>
                 <span className="font-serif italic text-sm text-[#C24E6E]">
                   {servesDriver}
                 </span>
               </div>
             </div>

             {/* Renders Smart Auto-Parsed Labeled Fragments Dynamic Mirrors */}
             {parsedNeed.hasExtracted && (
               <div className="bg-[#FAE6E1]/20 p-3.5 rounded-xl border border-dashed border-[#3A1E2A]/10 space-y-3">
                 <div className="text-[9px] uppercase tracking-[0.2em] text-[#B391A0] font-mono">
                   ✿ Extracted from your existing Need text
                 </div>

                 {(parsedNeed.reframe || parsedNeed.prototype) && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {parsedNeed.reframe && (
                       <div className="bg-[#FFF5DC] p-3 rounded-xl border border-[#3A1E2A]/5">
                         <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-1 flex items-center gap-1">
                           <span>↺</span> Reframe
                         </div>
                         <p className="text-xs text-[#3A1E2A] leading-relaxed whitespace-pre-wrap">
                           {parsedNeed.reframe}
                         </p>
                       </div>
                     )}
                     {parsedNeed.prototype && (
                       <div className="bg-[#9CD3B6]/20 p-3 rounded-xl border border-[#3A1E2A]/5">
                         <div className="text-[9px] uppercase tracking-[0.18em] text-[#1F6E4A] font-bold mb-1 flex items-center gap-1">
                           <span>◆</span> Prototype
                         </div>
                         <p className="text-xs text-[#3A1E2A] leading-relaxed whitespace-pre-wrap">
                           {parsedNeed.prototype}
                         </p>
                       </div>
                     )}
                   </div>
                 )}

                 {(parsedNeed.accelerators || parsedNeed.brakes) && (
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-[#3A1E2A]/5">
                     {parsedNeed.accelerators && (
                       <div>
                         <div className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-1">
                           ✿ Accelerators
                         </div>
                         <p className="text-xs font-mono text-[#5A3645]">
                           {parsedNeed.accelerators}
                         </p>
                       </div>
                     )}
                     {parsedNeed.brakes && (
                       <div>
                         <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-1">
                           ⚠ Brakes to watch
                         </div>
                         <p className="text-xs font-mono text-[#B391A0]">
                           {parsedNeed.brakes}
                         </p>
                       </div>
                     )}
                   </div>
                 )}
               </div>
             )}

             {/* Standard Fallback for Typed Life Design Data */}
             {!parsedNeed.hasExtracted && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#3A1E2A]/5">
                 <div className="bg-[#FFF5DC] p-3 rounded-xl border border-[#3A1E2A]/5">
                   <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-1 flex items-center gap-1">
                     <span>↺</span> Reframe
                   </div>
                   <p className="text-xs text-[#3A1E2A] leading-relaxed">
                     {entry.lifeDesign?.reframeNote ||
                       entry.lifeDesign?.acceptanceNote || (
                         <span className="text-[#B391A0]/50 italic">
                           No reframing written yet...
                         </span>
                       )}
                   </p>
                 </div>

                 <div className="bg-[#9CD3B6]/20 p-3 rounded-xl border border-[#3A1E2A]/5">
                   <div className="text-[9px] uppercase tracking-[0.18em] text-[#1F6E4A] font-bold mb-1 flex items-center gap-1">
                     <span>◆</span> Prototype
                     <span className="font-normal lowercase">
                       · {entry.lifeDesign?.prototype?.mode ?? "do"}
                     </span>
                   </div>
                   <p className="text-xs text-[#3A1E2A] leading-relaxed">
                     {entry.lifeDesign?.prototype?.action || (
                       <span className="text-[#B391A0]/50 italic">
                         No experiments queued...
                       </span>
                     )}
                   </p>
                 </div>
               </div>
             )}

             {/* Standard Fallback for Simple Nagoski Attributes */}
             {!parsedNeed.hasExtracted && (
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                 <div>
                   <div className="text-[9px] uppercase tracking-[0.18em] text-[#C24E6E] font-bold mb-1 flex items-center gap-1">
                     <BloomFlower size={10} petal="#E07A95" smile={false} />
                     Accelerators
                   </div>
                   <p className="text-xs font-mono text-[#5A3645]">
                     {entry.accelerators ? (
                       entry.accelerators.split(",").join(" ✿ ")
                     ) : (
                       <span className="text-[#B391A0]/40 font-sans italic">
                         None noted
                       </span>
                     )}
                   </p>
                 </div>

                 <div>
                   <div className="text-[9px] uppercase tracking-[0.18em] text-[#5A3645] font-bold mb-1 flex items-center gap-1">
                     <BrakeMark size={10} /> Brakes to watch
                   </div>
                   <p className="text-xs font-mono text-[#B391A0]">
                     {entry.brakes ? (
                       entry.brakes.split(",").join(" ✿ ")
                     ) : (
                       <span className="text-[#B391A0]/40 font-sans italic">
                         None noted
                       </span>
                     )}
                   </p>
                 </div>
               </div>
             )}
           </div>
         </div>

         {/* Expanded Card Chrome Footer & Integration Hooks */}
         <div className="mt-6 pt-4 border-t border-dashed border-[#3A1E2A]/10 flex items-center gap-4 flex-wrap print:hidden bg-[#FDF4F0] -mx-6 -mb-6 p-4 rounded-b-[18px]">
           <button
             onClick={onToggleLens}
             className="text-[9.5px] uppercase tracking-[0.25em] text-[#C24E6E] hover:text-[#3A1E2A] transition-colors font-semibold cursor-pointer"
           >
             {lensOpen ? "✿ Hide lenses" : "+ Apply lenses"}
           </button>
           <CompletionBar completion={completion} />

           {/* Collapse Trigger */}
           <button
             onClick={() => setIsExpanded(false)}
             className="text-[9.5px] uppercase tracking-[0.2em] text-[#5A3645] hover:text-[#C24E6E] transition-colors ml-auto font-bold cursor-pointer"
           >
             fold back ↑
           </button>

           {/* Version C Overlay Hook */}
           <button
             onClick={onFocus}
             className="bg-[#C24E6E] text-white px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] hover:bg-[#3A1E2A] transition-colors shadow-xs cursor-pointer"
             title="Open this value in focus mode"
           >
             focus ✿
           </button>
         </div>

         {/* Embedded Lens Editing Panel */}
         {lensOpen && (
           <div className="mt-8 pt-4 border-t border-[#3A1E2A]/10 animate-in fade-in duration-200">
             <LensPanel
               entry={entry}
               onChange={onChange}
               onToggleNvc={onToggleNvc}
             />
           </div>
         )}
       </div>
     )}

     {/* --- PRINT-ONLY LEDGER BLOCK --- */}
     <div className="hidden print:block text-[11px] text-[#5A3645] pt-3 mt-2 border-t border-gray-100 space-y-1 font-serif">
       {entry.workability ? (
         <div>Workability: {entry.workability}/5</div>
       ) : null}
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
       {entry.accelerators ? (
         <div>Accelerators: {entry.accelerators}</div>
       ) : null}
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
             return ` · boundary ${checked}/4 (${checked === 4 ? "clean" : "overreaching"})`;
           })()}
         </div>
       ) : null}
     </div>
   </section>
 );
};
