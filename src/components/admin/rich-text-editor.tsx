"use client"

import { forwardRef, useEffect, useRef, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import { ResizableImage, IMAGE_PRESETS, clampImageWidth } from "@/components/admin/resizable-image"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import { TableKit } from "@tiptap/extension-table"
import { Markdown } from "@tiptap/markdown"
import { marked } from "marked"
import { createNodeFromContent } from "@tiptap/core"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import * as Popover from "@radix-ui/react-popover"
import { cn } from "@/lib/utils"
import { detectContentFormat, plainTextToHtml } from "@/lib/content-format"
import { FilePicker } from "@/components/admin/file-picker"
import { toast } from "sonner"
import { compressImageFile } from "@/lib/client-image"
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  BetweenHorizonalEnd,
  Code2,
  CodeXml,
  Columns2,
  CornerUpLeft,
  CornerUpRight,
  Delete,
  Eraser,
  FileCode2,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  PanelTop,
  Pilcrow,
  Plus,
  Quote,
  Redo2,
  Rows3,
  Strikethrough,
  Table2,
  TableCellsMerge,
  TableCellsSplit,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react"

interface RichTextEditorProps {
  value?: string
  onChange?: (html: string) => void
  placeholder?: string
  minHeight?: number
}

const ToolbarButton = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }>(
  function ToolbarButton({ onClick, active, title, className, children, ...rest }, ref) {
    return (
      <button
        type="button"
        ref={ref}
        title={title}
        onClick={onClick}
        className={cn(
          "p-1.5 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
          active ? "bg-primary-100 text-primary-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          className
        )}
        {...rest}
      >
        {children}
      </button>
    )
  }
)

function ToolbarDivider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 shrink-0" />
}

async function uploadImageFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", await compressImageFile(file))
  const res = await fetch("/api/admin/upload", { method: "POST", body: formData })
  if (!res.ok) throw new Error("Upload failed")
  const data = await res.json()
  return data.url
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing...",
  minHeight = 320,
}: RichTextEditorProps) {
  const [sourceMode, setSourceMode] = useState(false)
  const [sourceText, setSourceText] = useState("")
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [imagePickerOpen, setImagePickerOpen] = useState(false)
  const [imageSelected, setImageSelected] = useState(false)
  const [imageAttrs, setImageAttrs] = useState<{ width?: number | null; align?: string | null }>({})
  const [imageWidthInput, setImageWidthInput] = useState("")

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Markdown,
      ResizableImage.configure({
        allowBase64: false,
        HTMLAttributes: { class: "rounded-xl max-w-full h-auto my-4" },
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
      }),
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      TableKit,
    ],
    content: "",
    editorProps: {
      attributes: { class: "tiptap px-4 py-3 focus:outline-none" },
      handleDrop: (view, event) => {
        const file = Array.from(event.dataTransfer?.files ?? []).find((f) => f.type.startsWith("image/"))
        if (!file) return false
        event.preventDefault()
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        const pos = coords?.pos ?? view.state.selection.from
        uploadImageFile(file)
          .then((url) => {
            const node = view.state.schema.nodes.image.create({ src: url })
            view.dispatch(view.state.tr.insert(pos, node))
          })
          .catch(() => toast.error("Image upload failed"))
        return true
      },
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.items ?? [])
          .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
          .map((item) => item.getAsFile())
          .filter((f): f is File => Boolean(f))
        if (files.length > 0) {
          event.preventDefault()
          files.forEach((file) => {
            uploadImageFile(file)
              .then((url) => {
                const node = view.state.schema.nodes.image.create({ src: url })
                view.dispatch(view.state.tr.replaceSelectionWith(node))
              })
              .catch(() => toast.error("Image upload failed"))
          })
          return true
        }

        const html = event.clipboardData?.getData("text/html") || ""
        const text = event.clipboardData?.getData("text/plain") || ""
        if (html.trim() || !text.trim()) return false

        if (detectContentFormat(text) === "markdown") {
          try {
            const converted = marked.parse(text, { async: false }) as string
            if (converted && converted !== text) {
              event.preventDefault()
              const content = createNodeFromContent(converted, view.state.schema, {
                slice: true,
                parseOptions: { preserveWhitespace: "full" },
              })
              const { from, to } = view.state.selection
              try {
                view.dispatch(view.state.tr.replaceWith(from, to, content).scrollIntoView())
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                if (!/open depth/i.test(msg)) throw err
                const $from = view.state.doc.resolve(from)
                const $to = view.state.doc.resolve(to)
                const newFrom = $from.depth > 0 ? $from.before($from.depth) : 0
                const newTo = $to.depth > 0 ? $to.after($to.depth) : view.state.doc.content.size
                view.dispatch(view.state.tr.replaceWith(newFrom, newTo, content).scrollIntoView())
              }
              return true
            }
          } catch {
            return false
          }
        }
        return false
      },
    },
    onUpdate: ({ editor }) => onChangeRef.current?.(editor.getHTML()),
    onSelectionUpdate: ({ editor }) => {
      const selected = editor.isActive("image")
      setImageSelected(selected)
      if (selected) {
        const attrs = editor.getAttributes("image")
        setImageAttrs(attrs)
        setImageWidthInput(typeof attrs.width === "number" ? String(attrs.width) : "")
      }
    },
    onTransaction: ({ editor }) => {
      if (editor.isActive("image")) setImageAttrs(editor.getAttributes("image"))
    },
  })

  const initializedRef = useRef(false)
  useEffect(() => {
    if (!editor || initializedRef.current) return
    initializedRef.current = true
    const raw = (value ?? "").trim()
    if (!raw) return
    const format = detectContentFormat(raw)
    if (format === "markdown") {
      editor.commands.setContent(raw, { contentType: "markdown" })
    } else {
      editor.commands.setContent(format === "plain" ? plainTextToHtml(raw) : raw)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor])

  function enterSourceMode() {
    if (!editor) return
    setSourceText(editor.getHTML())
    setSourceMode(true)
  }

  function exitSourceMode() {
    if (!editor) return
    editor.commands.setContent(sourceText, { contentType: "html" })
    setSourceMode(false)
    onChangeRef.current?.(editor.getHTML())
  }

  function applyLink() {
    if (!editor) return
    const url = linkUrl.trim()
    if (!url) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
    }
    setLinkOpen(false)
  }

  function handlePickImage(file: { id: string; url: string; filename: string }) {
    if (!editor || !file.url) return
    if (imageSelected) {
      editor.chain().focus().deleteSelection().insertContent({ type: "image", attrs: { src: file.url, alt: file.filename || "" } }).run()
    } else {
      editor.chain().focus().insertContent({ type: "image", attrs: { src: file.url, alt: file.filename || "" } }).run()
    }
    setImagePickerOpen(false)
  }

  const cmd = (fn: () => void) => {
    if (editor) fn()
  }

  return (
    <div
      className={cn(
        "border border-gray-300 rounded-lg bg-white overflow-hidden transition-shadow focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent",
        !editor && "opacity-60"
      )}
    >
      {imageSelected && editor && (
        <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 border-b border-primary-200 bg-primary-50 text-sm">
          <span className="inline-flex items-center gap-1.5 text-primary-700 font-medium">
            <ImageIcon className="h-4 w-4" /> Image selected
          </span>

          <span className="inline-flex items-center gap-1">
            {IMAGE_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => cmd(() => editor.chain().focus().updateAttributes("image", { width: preset.value }).run())}
                className={cn(
                  "px-1.5 py-0.5 text-xs font-medium rounded-md border transition-colors",
                  imageAttrs.width === preset.value
                    ? "bg-primary-600 text-white border-primary-600"
                    : "border-primary-300 text-primary-700 hover:bg-primary-100"
                )}
              >
                {preset.label}
              </button>
            ))}
            <label className="inline-flex items-center gap-1 ml-1 text-xs text-primary-700">
              <input
                type="number"
                min={15}
                max={100}
                value={imageWidthInput}
                onChange={(e) => {
                  setImageWidthInput(e.target.value)
                  const n = parseInt(e.target.value, 10)
                  if (!Number.isNaN(n)) {
                    cmd(() => editor.chain().focus().updateAttributes("image", { width: clampImageWidth(n) }).run())
                  }
                }}
                className="w-14 border border-primary-300 rounded-md px-1.5 py-0.5 text-xs text-gray-800 focus:ring-1 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              %
            </label>
          </span>

          <span className="inline-flex items-center gap-1">
            <button
              type="button"
              title="Center"
              onClick={() => cmd(() => editor.chain().focus().updateAttributes("image", { align: "center" }).run())}
              className={cn(
                "px-1.5 py-0.5 text-xs font-medium rounded-md border transition-colors",
                imageAttrs.align === "center"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-primary-300 text-primary-700 hover:bg-primary-100"
              )}
            >
              <AlignCenter className="h-3.5 w-3.5 inline -mt-0.5" />
            </button>
            <button
              type="button"
              title="Left"
              onClick={() => cmd(() => editor.chain().focus().updateAttributes("image", { align: "left" }).run())}
              className={cn(
                "px-1.5 py-0.5 text-xs font-medium rounded-md border transition-colors",
                imageAttrs.align === "left"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-primary-300 text-primary-700 hover:bg-primary-100"
              )}
            >
              <AlignLeft className="h-3.5 w-3.5 inline -mt-0.5" />
            </button>
            <button
              type="button"
              title="Right"
              onClick={() => cmd(() => editor.chain().focus().updateAttributes("image", { align: "right" }).run())}
              className={cn(
                "px-1.5 py-0.5 text-xs font-medium rounded-md border transition-colors",
                imageAttrs.align === "right"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-primary-300 text-primary-700 hover:bg-primary-100"
              )}
            >
              <AlignRight className="h-3.5 w-3.5 inline -mt-0.5" />
            </button>
            <button
              type="button"
              title="Float left"
              onClick={() => cmd(() => editor.chain().focus().updateAttributes("image", { align: "float-left", width: imageAttrs.width ?? 45 }).run())}
              className={cn(
                "px-1.5 py-0.5 text-xs font-medium rounded-md border transition-colors",
                imageAttrs.align === "float-left"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-primary-300 text-primary-700 hover:bg-primary-100"
              )}
            >
              Float L
            </button>
            <button
              type="button"
              title="Float right"
              onClick={() => cmd(() => editor.chain().focus().updateAttributes("image", { align: "float-right", width: imageAttrs.width ?? 45 }).run())}
              className={cn(
                "px-1.5 py-0.5 text-xs font-medium rounded-md border transition-colors",
                imageAttrs.align === "float-right"
                  ? "bg-primary-600 text-white border-primary-600"
                  : "border-primary-300 text-primary-700 hover:bg-primary-100"
              )}
            >
              Float R
            </button>
          </span>

          <button
            type="button"
            onClick={() => setImagePickerOpen(true)}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 hover:underline"
          >
            <Plus className="h-3.5 w-3.5" /> Replace
          </button>
          <button
            type="button"
            onClick={() => cmd(() => editor.chain().focus().deleteSelection().run())}
            className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline"
          >
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </button>
        </div>
      )}

      {!sourceMode && editor && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-gray-200 bg-gray-50">
          <ToolbarButton title="Undo" onClick={() => cmd(() => editor.chain().focus().undo().run())}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Redo" onClick={() => cmd(() => editor.chain().focus().redo().run())}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title="Paragraph" active={editor.isActive("paragraph")} onClick={() => cmd(() => editor.chain().focus().setParagraph().run())}>
            <Pilcrow className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => cmd(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => cmd(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => cmd(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
            <Heading3 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => cmd(() => editor.chain().focus().toggleBold().run())}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => cmd(() => editor.chain().focus().toggleItalic().run())}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Underline" active={editor.isActive("underline")} onClick={() => cmd(() => editor.chain().focus().toggleUnderline().run())}>
            <UnderlineIcon className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => cmd(() => editor.chain().focus().toggleStrike().run())}>
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => cmd(() => editor.chain().focus().toggleBulletList().run())}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => cmd(() => editor.chain().focus().toggleOrderedList().run())}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Blockquote" active={editor.isActive("blockquote")} onClick={() => cmd(() => editor.chain().focus().toggleBlockquote().run())}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Inline code" active={editor.isActive("code")} onClick={() => cmd(() => editor.chain().focus().toggleCode().run())}>
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Code block" active={editor.isActive("codeBlock")} onClick={() => cmd(() => editor.chain().focus().toggleCodeBlock().run())}>
            <CodeXml className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <Popover.Root open={linkOpen} onOpenChange={setLinkOpen}>
            <Popover.Trigger asChild>
              <ToolbarButton title="Link" active={editor.isActive("link")} onClick={() => {
                setLinkUrl((editor.getAttributes("link").href as string) || "")
              }}>
                <Link2 className="h-4 w-4" />
              </ToolbarButton>
            </Popover.Trigger>
            <Popover.Content align="start" sideOffset={6} className="z-50 w-72 bg-white rounded-xl border border-gray-200 shadow-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-2">Insert link</p>
              <input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyLink()
                  if (e.key === "Escape") setLinkOpen(false)
                }}
                placeholder="https://..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              />
              <div className="flex justify-end gap-2 mt-2">
                {editor.isActive("link") && (
                  <button type="button" onClick={() => { editor.chain().focus().unsetLink().run(); setLinkOpen(false) }} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                )}
                <button type="button" onClick={applyLink} className="bg-primary-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-primary-700">
                  Apply
                </button>
              </div>
            </Popover.Content>
          </Popover.Root>

          <Popover.Root open={imagePickerOpen} onOpenChange={setImagePickerOpen}>
            <Popover.Trigger asChild>
              <ToolbarButton title="Insert image" active={imageSelected}>
                <ImageIcon className="h-4 w-4" />
              </ToolbarButton>
            </Popover.Trigger>
            <Popover.Content align="start" sideOffset={6} className="z-50 w-80 bg-white rounded-xl border border-gray-200 shadow-xl p-4">
              <p className="text-sm font-medium text-gray-800 mb-2">Insert image</p>
              <FilePicker onSelect={handlePickImage} label="" />
              <p className="text-xs text-gray-400 mt-2">Tip: you can also drag &amp; drop or paste an image directly into the editor.</p>
            </Popover.Content>
          </Popover.Root>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <ToolbarButton title="Table" active={editor.isActive("table")}>
                <Table2 className="h-4 w-4" />
              </ToolbarButton>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="start" sideOffset={6} className="z-50 min-w-[200px] bg-white rounded-xl border border-gray-200 shadow-xl p-1.5">
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <Table2 className="h-4 w-4 text-gray-400" /> Insert table
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().addRowBefore().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <CornerUpLeft className="h-4 w-4 text-gray-400" /> Add row above
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().addRowAfter().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <CornerUpRight className="h-4 w-4 text-gray-400" /> Add row below
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().addColumnBefore().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <Columns2 className="h-4 w-4 text-gray-400" /> Add column before
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().addColumnAfter().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <Rows3 className="h-4 w-4 text-gray-400" /> Add column after
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().mergeCells().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <TableCellsMerge className="h-4 w-4 text-gray-400" /> Merge cells
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().splitCell().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <TableCellsSplit className="h-4 w-4 text-gray-400" /> Split cell
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().toggleHeaderRow().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <PanelTop className="h-4 w-4 text-gray-400" /> Toggle header row
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-gray-100" />
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().deleteRow().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <Minus className="h-4 w-4 text-gray-400" /> Delete row
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().deleteColumn().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-gray-700 rounded-lg hover:bg-gray-100 outline-none cursor-pointer">
                <Delete className="h-4 w-4 text-gray-400" /> Delete column
              </DropdownMenu.Item>
              <DropdownMenu.Item onSelect={() => cmd(() => editor.chain().focus().deleteTable().run())} className="flex items-center gap-2 px-2.5 py-1.5 text-sm text-red-600 rounded-lg hover:bg-red-50 outline-none cursor-pointer">
                <Trash2 className="h-4 w-4 text-red-500" /> Delete table
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          <ToolbarDivider />

          <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => cmd(() => editor.chain().focus().setTextAlign("left").run())}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => cmd(() => editor.chain().focus().setTextAlign("center").run())}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => cmd(() => editor.chain().focus().setTextAlign("right").run())}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          <ToolbarButton title="Horizontal rule" onClick={() => cmd(() => editor.chain().focus().setHorizontalRule().run())}>
            <BetweenHorizonalEnd className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton title="Clear formatting" onClick={() => cmd(() => editor.chain().focus().unsetAllMarks().run())}>
            <Eraser className="h-4 w-4" />
          </ToolbarButton>
        </div>
      )}

      {sourceMode ? (
        <div className="p-3">
          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            spellCheck={false}
            className="w-full font-mono text-sm border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-y"
            style={{ minHeight }}
          />
          <p className="text-xs text-gray-400 mt-2 inline-flex items-center gap-1">
            <FileCode2 className="h-3 w-3" /> Raw HTML — unsupported tags are stripped automatically when you switch back to Visual mode.
          </p>
        </div>
      ) : (
        <div style={{ minHeight }} className="max-h-[600px] overflow-y-auto">
          <EditorContent editor={editor} />
          {editor && !sourceMode && (
            <BubbleMenu
              editor={editor}
              shouldShow={({ editor }) => !editor.state.selection.empty}
            >
              <div className="flex items-center gap-0.5 bg-gray-900 text-white rounded-lg px-1.5 py-1 shadow-lg">
                <button type="button" onClick={() => cmd(() => editor.chain().focus().toggleBold().run())} className={cn("p-1 rounded-md hover:bg-white/20", editor.isActive("bold") && "bg-white/20")}>
                  <Bold className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => cmd(() => editor.chain().focus().toggleItalic().run())} className={cn("p-1 rounded-md hover:bg-white/20", editor.isActive("italic") && "bg-white/20")}>
                  <Italic className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => cmd(() => editor.chain().focus().toggleUnderline().run())} className={cn("p-1 rounded-md hover:bg-white/20", editor.isActive("underline") && "bg-white/20")}>
                  <UnderlineIcon className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => cmd(() => editor.chain().focus().toggleStrike().run())} className={cn("p-1 rounded-md hover:bg-white/20", editor.isActive("strike") && "bg-white/20")}>
                  <Strikethrough className="h-4 w-4" />
                </button>
                <span className="w-px h-4 bg-white/20 mx-0.5" />
                <button type="button" onClick={() => cmd(() => editor.chain().focus().toggleHeading({ level: 2 }).run())} className={cn("p-1 rounded-md hover:bg-white/20", editor.isActive("heading", { level: 2 }) && "bg-white/20")}>
                  <Heading2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => cmd(() => editor.chain().focus().toggleHeading({ level: 3 }).run())} className={cn("p-1 rounded-md hover:bg-white/20", editor.isActive("heading", { level: 3 }) && "bg-white/20")}>
                  <Heading3 className="h-4 w-4" />
                </button>
              </div>
            </BubbleMenu>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-t border-gray-200 bg-gray-50">
        <span className="text-xs text-gray-400">Accepts HTML, Markdown, plain text &amp; rich text (Word/Google Docs).</span>
        <button
          type="button"
          onClick={() => (sourceMode ? exitSourceMode() : enterSourceMode())}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-primary-700"
        >
          {sourceMode ? <Pilcrow className="h-3.5 w-3.5" /> : <Code2 className="h-3.5 w-3.5" />}
          {sourceMode ? "Switch to Visual mode" : "Source / HTML"}
        </button>
      </div>
    </div>
  )
}
