# Composer Attachment Input — Paste, Drag-Drop, Click-to-Preview

How the chat composer accepts attachments through **three** input paths — file picker, clipboard paste, and drag-and-drop — all converging on a single validated pipeline that produces the same pending-strip UX. Plus a focus fix so pressing Enter after a drop sends immediately.

All code lives in [src/views/apps/chat/SendMsgForm.tsx](../../src/views/apps/chat/SendMsgForm.tsx).

## The three input paths

| Path | Trigger | Handler | Reaches |
| --- | --- | --- | --- |
| File picker | Click 📎 (paperclip) | `handleFiles(e)` | `enqueueFiles(files)` |
| Clipboard paste | Ctrl/Cmd+V in the text input | `handlePaste(e)` | `enqueueFiles(files)` |
| Drag-and-drop | Drag a file from Finder/Explorer onto the composer | `handleDrop(e)` | `enqueueFiles(files)` |

Every path normalizes its input to a plain `File[]` and routes it through the same converging pipeline. That means **every validation rule, MIME-type inference, compression step, and the per-message count cap fires identically** regardless of how the file arrived. There is no separate paste-validation or drop-validation path — they all inherit `enqueueFiles`'s rules for free.

## The shared pipeline — `enqueueFiles(files: File[])`

Single source of truth for all attachment intake. Located near [SendMsgForm.tsx:443](../../src/views/apps/chat/SendMsgForm.tsx#L443).

```ts
const enqueueFiles = async (files: File[]) => {
  if (!files.length) return

  // Count cap: KEEP all files in pending (better than silently dropping
  // user's picks). Warning toast + Send button gated by pending.length
  // tells the user they need to remove some.
  const projected = pending.length + files.length
  if (projected > MAX_FILES_PER_MESSAGE) {
    toast.error(`${MAX_FILES_PER_MESSAGE}-file limit — remove N attachments to send`)
  }

  setProcessingFiles(true)
  try {
    // Image compression + audio/video duration probe — in parallel.
    const processed = await Promise.all(files.map(f => maybeCompressImage(f)))
    const next: PendingFile[] = await Promise.all(
      processed.map(async f => {
        const kind = inferKind(f.type)           // image / video / audio / document
        const durationSec = (kind === 'audio' || kind === 'video')
          ? await probeMediaDuration(f, kind)    // resolves undefined on timeout / decode failure
          : undefined
        return {
          key: `${f.name}-${f.size}-${f.lastModified}-${rand}`,
          file: f,
          previewUrl: URL.createObjectURL(f),
          kind,
          ...(durationSec ? { durationSec } : {})
        }
      })
    )
    setPending(prev => [...prev, ...next])
  } finally {
    setProcessingFiles(false)
  }
}
```

**Why a single pipeline matters:** if we ever change the count cap, the compression threshold, or how audio duration is probed, paste / drop / picker all pick up the change automatically. No path can diverge.

## Paste-to-attach

WhatsApp-Web-style — paste a screenshot, an image copied from a browser tab, or any file from your OS file explorer.

Handler at [SendMsgForm.tsx:549](../../src/views/apps/chat/SendMsgForm.tsx#L549), bound via `onPaste` on the `<TextField>`:

```ts
const handlePaste = (e: ClipboardEvent<HTMLElement>) => {
  const dt = e.clipboardData
  if (!dt) return

  let files = Array.from(dt.files ?? [])
  if (files.length === 0 && dt.items) {
    // Older browser path — only `.items` is populated. Filter to file kind.
    files = Array.from(dt.items)
      .filter(it => it.kind === 'file')
      .map(it => it.getAsFile())
      .filter((f): f is File => f !== null)
  }
  if (files.length === 0) return  // text-only paste — let default happen

  e.preventDefault()              // suppress text fallback for file pastes
  void enqueueFiles(files)
}
```

**Key behavior:**
- Plain-text paste is **untouched** — `e.preventDefault()` only fires when files are present. Pasting a URL or text snippet works exactly as before.
- Works for screenshots (Cmd+Shift+4 → Cmd+V on macOS), images copied from any browser, files copied from Finder/Explorer.
- Both `.files` and `.items` paths are supported for cross-browser coverage.

## Click-to-preview pending attachments

After a file is queued (via any of the three paths), clicking the chip opens the **same** `AttachmentPreviewDialog` used for received messages. The chip's blob URL is wrapped in a synthesized `ChatAttachmentType` so image / video / PDF / document all render through the existing viewer.

State + dialog mount at [SendMsgForm.tsx:152](../../src/views/apps/chat/SendMsgForm.tsx#L152) and the bottom of the JSX:

```ts
const [previewingPending, setPreviewingPending] = useState<PendingFile | null>(null)

// ...near the chip click handler
<PreviewChip onClick={() => setPreviewingPending(p)}>...</PreviewChip>

// ...end of <Form>
{previewingPending && (
  <AttachmentPreviewDialog
    open
    onClose={() => setPreviewingPending(null)}
    attachment={{
      id: previewingPending.key,
      type: previewingPending.kind,
      url: previewingPending.previewUrl,
      filename: previewingPending.file.name,
      mimeType: previewingPending.file.type,
      size: previewingPending.file.size,
      ...(previewingPending.durationSec ? { duration: previewingPending.durationSec } : {})
    }}
  />
)}
```

**Why the X button on each chip + the inline audio player both call `e.stopPropagation()`:** without it, clicking ✕ to remove or clicking the audio scrubber would *also* trigger the chip's `onClick` → opening the preview on top of the action the user intended. Each interactive sub-element stops bubbling so the chip-level click only fires on bare-chip clicks.

**Audio chips do NOT open the preview** — their inline player is sufficient and a full dialog adds nothing. The chip click handler is conditional on `kind !== 'audio'`.

## Drag-and-drop

Drop a file from Finder / Explorer / Photos directly into the composer.

### Type guard — drop only fires on actual file drags

[SendMsgForm.tsx:493](../../src/views/apps/chat/SendMsgForm.tsx#L493) — `dragHasFiles(e)`:

```ts
const dragHasFiles = (e: { dataTransfer: DataTransfer }): boolean => {
  if (!e.dataTransfer) return false
  const types = e.dataTransfer.types
  if (!types) return false
  for (let i = 0; i < types.length; i++) {
    const t = types[i]
    // Chrome/Safari: 'Files'. Firefox sometimes: 'application/x-moz-file'.
    if (t === 'Files' || t === 'application/x-moz-file') return true
  }
  return false
}
```

This filter means **dragging a URL from another tab, dragging text from another part of the page, or dragging a tab itself never triggers the overlay**. Only OS-level file drags qualify.

### Four handlers — enter / over / leave / drop

[SendMsgForm.tsx:507-540](../../src/views/apps/chat/SendMsgForm.tsx#L507-L540):

```ts
const handleDragEnter = (e) => {
  if (!dragHasFiles(e)) return
  e.preventDefault()
  dragCounter.current += 1
  if (dragCounter.current === 1) setIsDragging(true)   // show overlay
}

const handleDragOver = (e) => {
  if (!dragHasFiles(e)) return
  e.preventDefault()   // REQUIRED — marks target as droppable; without it `drop` never fires
}

const handleDragLeave = (e) => {
  if (!dragHasFiles(e)) return
  e.preventDefault()
  dragCounter.current = Math.max(0, dragCounter.current - 1)
  if (dragCounter.current === 0) setIsDragging(false)  // hide overlay
}

const handleDrop = (e) => {
  if (!dragHasFiles(e)) return
  e.preventDefault()
  dragCounter.current = 0
  setIsDragging(false)
  const files = Array.from(e.dataTransfer.files ?? [])
  if (files.length) {
    void enqueueFiles(files)
    textInputRef.current?.focus()   // ← see "Drop → Enter to send" below
  }
}
```

Bound on the `<Form>` element at [SendMsgForm.tsx:710-714](../../src/views/apps/chat/SendMsgForm.tsx#L710-L714).

### Why a counter ref, not a boolean

`dragenter` and `dragleave` fire on **every** child element boundary, not just the top-level target. Without the counter, moving the cursor over any child of `<Form>` while dragging would emit a leave-then-enter sequence, flickering the overlay on and off. The counter only flips `isDragging`:
- 0 → 1 (overlay appears)
- N → 0 (overlay disappears)

All intermediate transitions are no-ops on the visual state.

### Drop → Enter to send

[SendMsgForm.tsx:540](../../src/views/apps/chat/SendMsgForm.tsx#L540) — `textInputRef.current?.focus()` after `enqueueFiles`.

**Why:** the drop event fires on the `<Form>` element, **not** on the text input inside it. After the drop, keyboard focus stays on whatever the cursor was over (often nothing). The Enter-to-send logic lives on the `<TextField>`'s `onKeyDown` — if the input isn't focused, the next keystroke never reaches it.

Result before the fix: drop a file → press Enter → nothing happens.
After: drop a file → input auto-focuses → press Enter → send fires immediately.

Optional-chained so it's a no-op when the TextField isn't rendered (audio-recording state).

## The drop overlay

```tsx
{isDragging && (
  <Box
    aria-hidden
    sx={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',           // critical — never intercepts drop events
      borderRadius: 2,
      border: theme => `2px dashed ${theme.palette.secondary.main}`,
      backgroundColor: 'customColors.Surface',
      color: 'customColors.OnSurfaceVariant'
    }}
  >
    <Typography variant='subtitle2' sx={{ fontWeight: 600 }}>
      Drag files here
    </Typography>
  </Box>
)}
```

**`pointerEvents: 'none'`** is non-negotiable — without it the overlay would receive the `drop` event itself (instead of bubbling to `<Form>`'s handler), and nothing would attach.

**Matches WhatsApp** — just the dashed border and a short label, no icon. (Earlier iteration had an `mdi:tray-arrow-down` icon which was removed for visual parity.)

## Voice-record button styling

The 🎤 button (visible when there's no text and not recording) is styled to mirror the Send button — same filled `secondary.main` circle, same hover/active animations, same disabled token. So the composer's right-edge button reads consistently whether it's "send" or "record".

[SendMsgForm.tsx:1075-1090](../../src/views/apps/chat/SendMsgForm.tsx#L1075-L1090):

```tsx
<IconButton
  aria-label='Record voice message'
  onClick={startRecording}
  disabled={uploading}
  sx={{
    flexShrink: 0,
    width: 42,
    height: 42,
    borderRadius: '50%',
    backgroundColor: 'secondary.main',
    color: 'common.white',
    transition: 'background-color 0.15s, transform 0.15s',
    '&:hover': { backgroundColor: 'secondary.dark', transform: 'scale(1.06)' },
    '&:active': { transform: 'scale(0.94)' },
    '&.Mui-disabled': { backgroundColor: 'action.disabledBackground', color: 'action.disabled' }
  }}
>
  <Icon icon='mdi:microphone' fontSize='1.375rem' />
</IconButton>
```

## End-to-end timeline — drag-drop + send

| T | Event |
| --- | --- |
| 0 ms | User starts dragging a file from Finder |
| ~10 ms | `dragenter` fires on `<Form>` → `dragHasFiles` → counter 0→1 → overlay appears |
| ~10-2000 ms | `dragover` fires repeatedly → `preventDefault` keeps target armed |
| Drop ms | User releases over `<Form>` → `handleDrop` |
| Drop+1 ms | `dragCounter = 0` + `setIsDragging(false)` → overlay hides |
| Drop+1 ms | `enqueueFiles(files)` runs (compress/probe in background) |
| Drop+1 ms | `textInputRef.current?.focus()` — input now has keyboard focus |
| Drop+50-300 ms | Pipeline resolves → `setPending` → chip appears in strip |
| User press Enter | `onKeyDown` on TextField fires `handleSendMsg` → upload + send |

## Edge cases handled

| Case | Behavior |
| --- | --- |
| Drag a URL from another tab | `dragHasFiles` returns false → overlay never appears, drop is ignored |
| Drag text from page | Same — filtered out by `types` check |
| Cursor moves over child elements while dragging | Counter increments/decrements; overlay stays stable |
| Drop while audio recording is active | TextField is unmounted; `?.focus()` is a no-op; file still queues normally |
| Drop file but exceed the 10-file cap | All files queue; toast warns user; Send button disabled until they remove some |
| Paste a screenshot via Cmd+V | `dt.files` populated → `enqueueFiles` → chip appears, can preview by click |
| Paste plain text | `dt.files` empty + `dt.items` empty of files → `return` early, native paste proceeds |
| Click ✕ on chip | `stopPropagation` → only the remove fires, preview does NOT open |
| Click audio chip's scrubber | `stopPropagation` → only audio play/pause fires |
| Drop, then press Enter immediately | Input is focused (drop-focus fix) → `handleSendMsg` runs |
| Drop, then click somewhere else, then press Enter | Standard browser focus rules — Enter does nothing unless input is re-focused. Expected. |

## What is NOT touched

- **Send flow** (`handleSendMsg`) — same path, same upload, same dispatch.
- **File picker** (`handleFiles`) — already used `enqueueFiles`; unchanged.
- **Audio recording** — independent UI state; drag/paste/preview operate around it.
- **Edit / reply / draft / emoji** — none reads attachment state or drag/focus.
- **Sidebar, ChatLog, ChatContent, MessageActions, store, API layer, socket handlers** — none touched.

## Related Files

- [src/views/apps/chat/SendMsgForm.tsx](../../src/views/apps/chat/SendMsgForm.tsx) — the composer; all three input paths + `enqueueFiles` + the drop-focus fix
- [src/views/apps/chat/AttachmentPreviewDialog.tsx](../../src/views/apps/chat/AttachmentPreviewDialog.tsx) — full-size viewer reused for both received attachments and pre-send preview
- [src/lib/chat/imageCompression.ts](../../src/lib/chat/imageCompression.ts) — `maybeCompressImage` used inside `enqueueFiles`
- [src/lib/chat/api.ts](../../src/lib/chat/api.ts) — `uploadChatFiles` (the upload-on-send target — unchanged by this work)
