"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveRulesNoteAction } from "./actions";

const SAVE_DELAY_MS = 600;

export default function RulesNotepad({ initialNote }: { initialNote: string }) {
  const [note, setNote] = useState(initialNote);
  const [saveStatus, setSaveStatus] = useState("");
  const [saveError, setSaveError] = useState("");
  const [isPending, startTransition] = useTransition();
  const lastSavedNoteRef = useRef(initialNote);
  const hasEditedRef = useRef(false);

  useEffect(() => {
    if (!hasEditedRef.current || note === lastSavedNoteRef.current) return;

    setSaveStatus("Đang lưu...");
    setSaveError("");

    const timer = window.setTimeout(() => {
      startTransition(async () => {
        const result = await saveRulesNoteAction(note);

        if (!result.ok) {
          setSaveError(result.error);
          setSaveStatus("");
          return;
        }

        lastSavedNoteRef.current = result.data.content;
        setSaveStatus("Đã lưu");
      });
    }, SAVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [note]);

  function updateNote(value: string) {
    hasEditedRef.current = true;
    setNote(value);
  }

  return (
    <main className="relative min-h-[calc(100vh-64px)] bg-white">
      <div className="pointer-events-none absolute right-5 top-4 z-10 text-xs font-medium text-slate-400">
        {saveError || (isPending ? "Đang lưu..." : saveStatus)}
      </div>
      <textarea
        aria-label="Ghi chú quy tắc"
        autoFocus
        className="h-[calc(100vh-64px)] w-full resize-none border-0 bg-white px-6 py-6 text-base leading-8 text-slate-900 outline-none placeholder:text-slate-300 sm:px-10 sm:py-8 sm:text-lg"
        onChange={(event) => updateNote(event.target.value)}
        placeholder="Ghi quy tắc ở đây..."
        spellCheck={false}
        value={note}
      />
    </main>
  );
}
