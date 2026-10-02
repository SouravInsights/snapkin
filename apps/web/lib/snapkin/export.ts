/* Client-side PNG export of the live canvas node. WYSIWYG: the same DOM the
 * user previews is rasterized at the exact social-platform resolution. */

import { toBlob, toPng } from "html-to-image"
import { CANVAS_SIZES, type CanvasSizeId } from "./config"

/** Pin the output bitmap to the exact platform size (fractional preview
 * widths would otherwise round a pixel off). */
const renderOptions = (size: CanvasSizeId) => ({
  canvasWidth: CANVAS_SIZES[size].out[0],
  canvasHeight: CANVAS_SIZES[size].out[1],
  // canvasWidth/Height are multiplied by pixelRatio — pin it so output is exact
  pixelRatio: 1,
  // Strip the in-app preview frame: exports are full-bleed platform images
  style: {
    borderRadius: "0px",
    boxShadow: "none",
  },
  // The canvas subtree only uses system fonts, so embedding webfonts is
  // wasted bytes and a failure surface. Skip it.
  skipFonts: true,
  cacheBust: true,
})

export async function exportPng(
  node: HTMLElement,
  size: CanvasSizeId
): Promise<void> {
  const dataUrl = await toPng(node, renderOptions(size))
  const [w, h] = CANVAS_SIZES[size].out
  const link = document.createElement("a")
  link.download = `snapkin-${size}-${w}x${h}.png`
  link.href = dataUrl
  link.click()
}

export async function copyPng(
  node: HTMLElement,
  size: CanvasSizeId
): Promise<void> {
  if (
    typeof ClipboardItem === "undefined" ||
    !navigator.clipboard ||
    !("write" in navigator.clipboard)
  ) {
    throw new Error("Clipboard images are not supported in this browser")
  }
  const blob = await toBlob(node, renderOptions(size))
  if (!blob) throw new Error("Could not render the image")
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
}
