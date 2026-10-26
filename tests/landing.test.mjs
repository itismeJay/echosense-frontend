import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const readSource = (relativePath) => readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");

test("header, every section and the footer share one centered container", async () => {
  const page = await readSource("app/page.tsx");
  assert.match(page, /const CONTAINER = "mx-auto w-full max-w-\[1200px\] px-5 sm:px-8";/);
  const containerUses = page.match(/\$\{CONTAINER\}/g) ?? [];
  // header, hero, 7 sections, footer
  assert.ok(containerUses.length >= 10, `only ${containerUses.length} uses`);
});

test("the hero is dark in both themes and offers Sign in and See how it works", async () => {
  const page = await readSource("app/page.tsx");
  assert.match(page, /className="dark border-b border-line bg-bg text-ink"/);
  assert.match(page, /Hears what cameras can&apos;t\./);
  assert.match(page, /href="\/login"/);
  assert.match(page, /href="#how-it-works"/);
  assert.match(page, /id="how-it-works"/);
});

test("illustrations are labelled for assistive technology", async () => {
  const [device, illustrations, phone] = await Promise.all([
    readSource("components/landing/DeviceIllustration.tsx"),
    readSource("components/landing/Illustrations.tsx"),
    readSource("components/landing/PhoneNotification.tsx"),
  ]);
  assert.match(device, /role="img"[\s\S]*aria-labelledby="device-title device-desc"/);
  assert.match(device, /<title id="device-title">/);
  for (const match of illustrations.matchAll(/<svg[^>]*>/g)) {
    assert.match(match[0], /role="img"/);
    assert.match(match[0], /aria-label=|aria-labelledby=/);
  }
  assert.match(phone, /role="img"\s+aria-label="Example: a phone lock screen/);
});

test("motion respects reduced-motion; the notification is the one scroll-triggered moment", async () => {
  const [css, phone] = await Promise.all([readSource("app/globals.css"), readSource("components/landing/PhoneNotification.tsx")]);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\s*\.es-wave \{ animation: none;/);
  assert.match(phone, /new IntersectionObserver/);
  assert.match(phone, /observer\.disconnect\(\)/);
  // Fixed aspect ratio: the notification arriving never shifts layout.
  assert.match(phone, /aspect-\[9\/19\]/);
});

test("copy makes no fake stats, testimonials or logos", async () => {
  const page = await readSource("app/page.tsx");
  assert.doesNotMatch(page, /testimonial|trusted by|\d+% |\d+,\d{3}\+? (schools|students)|revolutionary|cutting-edge|AI-powered/i);
  assert.match(page, /A DNSC BSIT capstone project, 2026\./);
});
