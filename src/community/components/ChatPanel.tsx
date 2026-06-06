import { useEffect, useMemo, useRef, useState } from "react";
import type { CommunityProfile, CommunityMessage } from "../../shared/contract";

type Props = {
  communities: CommunityProfile[];
  activeId: string;
  messagesFor: (community: CommunityProfile) => CommunityMessage[];
  userId: string;
  authorName: (id: string) => string;
  onSelect: (community: CommunityProfile) => void;
  onSend: (communityId: string, text: string) => void;
  onClose: () => void;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function formatTime(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

type MessageGroup = {
  authorId: string;
  messages: CommunityMessage[];
};

function groupMessages(messages: CommunityMessage[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  for (const m of messages) {
    const last = groups[groups.length - 1];
    if (last && last.authorId === m.author_id) {
      last.messages.push(m);
    } else {
      groups.push({ authorId: m.author_id, messages: [m] });
    }
  }
  return groups;
}

export function ChatPanel({
  communities,
  activeId,
  messagesFor,
  userId,
  authorName,
  onSelect,
  onSend,
  onClose,
}: Props) {
  const [draft, setDraft] = useState("");
  const [showListOnMobile, setShowListOnMobile] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const active = communities.find((c) => c.id === activeId) ?? communities[0];
  const messages = active ? messagesFor(active) : [];
  const groups = useMemo(() => groupMessages(messages), [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!active) return null;

  function submit() {
    const text = draft.trim();
    if (!text) return;
    onSend(active.id, text);
    setDraft("");
  }

  function lastPreview(community: CommunityProfile): string {
    const msgs = messagesFor(community);
    const last = msgs[msgs.length - 1];
    if (!last) return "No messages yet";
    const prefix = last.author_id === userId ? "You: " : "";
    return prefix + last.text;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-tribe-900/50 p-3 backdrop-blur-sm sm:p-6"
      onClick={onClose}
    >
      <div
        className="flex h-[min(720px,92vh)] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-tribe-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* My chats sidebar */}
        <aside
          className={`flex w-full flex-col border-r border-tribe-100 bg-tribe-50 sm:w-56 sm:shrink-0 ${
            showListOnMobile ? "absolute inset-0 z-10 sm:relative" : "hidden sm:flex"
          }`}
        >
          <div className="flex items-center justify-between border-b border-tribe-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-tribe-800">My chats</h3>
            <button
              type="button"
              onClick={() => setShowListOnMobile(false)}
              className="text-xs text-tribe-400 sm:hidden"
            >
              Done
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto py-1">
            {communities.map((c) => {
              const selected = c.id === active.id;
              const preview = lastPreview(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(c);
                      setShowListOnMobile(false);
                    }}
                    className={`flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors ${
                      selected ? "bg-white" : "hover:bg-white/70"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        selected
                          ? "bg-tribe-600 text-white"
                          : "bg-tribe-200 text-tribe-700"
                      }`}
                    >
                      {initials(c.name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-tribe-800">
                        {c.name}
                      </span>
                      <span className="block truncate text-xs text-tribe-400">{preview}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Active thread */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex items-center gap-3 border-b border-tribe-100 px-4 py-3">
            <button
              type="button"
              onClick={() => setShowListOnMobile(true)}
              className="rounded-lg px-2 py-1 text-sm text-tribe-500 hover:bg-tribe-50 sm:hidden"
            >
              ☰
            </button>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-tribe-600 text-xs font-semibold text-white">
              {initials(active.name)}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-display text-base font-semibold text-tribe-800">
                {active.name}
              </h3>
              <p className="text-xs text-tribe-400">
                {active.member_ids.length} members · you're in
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-tribe-400 transition-colors hover:bg-tribe-50 hover:text-tribe-700"
              aria-label="Close chat"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#f7f8f6] px-4 py-4">
            {groups.length === 0 ? (
              <p className="py-12 text-center text-sm text-tribe-400">
                Say hello to {active.name} 👋
              </p>
            ) : (
              <div className="space-y-4">
                {groups.map((group, gi) => {
                  const mine = group.authorId === userId;
                  const name = mine ? "You" : authorName(group.authorId);
                  return (
                    <div
                      key={gi}
                      className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}
                    >
                      {!mine && (
                        <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-tribe-200 text-[10px] font-semibold text-tribe-600">
                          {initials(name)}
                        </span>
                      )}
                      <div
                        className={`flex max-w-[75%] flex-col gap-0.5 ${
                          mine ? "items-end" : "items-start"
                        }`}
                      >
                        {!mine && (
                          <span className="px-1 text-[11px] font-medium text-tribe-400">
                            {name}
                          </span>
                        )}
                        {group.messages.map((m, mi) => (
                          <div
                            key={mi}
                            className={`px-3 py-2 text-sm leading-snug ${
                              mine
                                ? "rounded-2xl rounded-br-md bg-tribe-600 text-white"
                                : "rounded-2xl rounded-bl-md border border-tribe-100 bg-white text-tribe-800"
                            }`}
                          >
                            {m.text}
                          </div>
                        ))}
                        <span className="px-1 text-[10px] text-tribe-300">
                          {formatTime(group.messages[group.messages.length - 1].ts)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-tribe-100 bg-white px-4 py-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder={`Message ${active.name}…`}
              className="flex-1 rounded-xl border border-tribe-200 px-3.5 py-2.5 text-sm focus:border-tribe-400 focus:outline-none focus:ring-1 focus:ring-tribe-400"
            />
            <button
              type="button"
              onClick={submit}
              disabled={!draft.trim()}
              className="rounded-xl bg-ember-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ember-600 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
