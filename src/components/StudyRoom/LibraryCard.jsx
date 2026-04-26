import { convertToExcalidrawElements } from "@excalidraw/excalidraw";

const CARD_WIDTH = 280;
const HEADER_HEIGHT = 32;
const PADDING = 16;
const TITLE_FONT = 20;
const BODY_FONT = 14;
const FOOTER_FONT = 12;

const TYPE_HEADER_COLORS = {
  note: "#a855f7",
  summary: "#14b8a6",
  flashcard_deck: "#f97316",
};

/**
 * Build Excalidraw elements for a library file card on the canvas.
 * Card: rounded rect background (#1a1a2e), header color band, title, content preview or "X cards", footer "Your note – view only".
 * All elements are locked and grouped by file.id.
 * @param {Object} file - { id, type, title, tag, lastEdited, content?, cardCount?, questions? }
 * @param {Object} viewport - { scrollX, scrollY, width?, height? } (width/height optional for centering)
 * @returns {Array} Excalidraw elements (use addElements or updateScene with these)
 */
export function buildLibraryCard(file, viewport) {
  const centerX = (viewport.scrollX ?? 0) + ((viewport.width ?? 800) / 2);
  const centerY = (viewport.scrollY ?? 0) + ((viewport.height ?? 600) / 2);

  let bodyText = "";
  if (file.type === "flashcard_deck") {
    const count = file.cardCount ?? 0;
    const previews = (file.questions || []).slice(0, 3).join(" / ");
    bodyText = `${count} cards. ${previews || ""}`;
  } else {
    bodyText = (file.content || "").slice(0, 300);
    if (file.content && file.content.length > 300) bodyText += "…";
  }

  const titleLines = Math.ceil((file.title?.length || 0) / 35) || 1;
  const titleHeight = titleLines * 26;
  const bodyHeight = bodyText ? Math.min(80, Math.ceil(bodyText.length / 38) * 18) : 0;
  const cardHeight = HEADER_HEIGHT + PADDING + titleHeight + (bodyHeight ? bodyHeight + 8 : 0) + 28;

  const x = Math.round(centerX - CARD_WIDTH / 2);
  const y = Math.round(centerY - cardHeight / 2);
  const groupId = `lib-${file.id}`;

  const headerColor = TYPE_HEADER_COLORS[file.type] || "#6b7280";

  const skeletons = [
    {
      type: "rectangle",
      x,
      y,
      width: CARD_WIDTH,
      height: cardHeight,
      backgroundColor: "#1a1a2e",
      strokeColor: "#374151",
      roundness: { type: "round", value: 12 },
      groupIds: [groupId],
      locked: true,
    },
    {
      type: "rectangle",
      x,
      y,
      width: CARD_WIDTH,
      height: HEADER_HEIGHT,
      backgroundColor: headerColor,
      strokeColor: headerColor,
      fillStyle: "solid",
      roundness: { type: "round", value: 12 },
      groupIds: [groupId],
      locked: true,
    },
    {
      type: "text",
      text: file.title || "Untitled",
      x: x + PADDING,
      y: y + HEADER_HEIGHT + 10,
      width: CARD_WIDTH - PADDING * 2,
      fontSize: TITLE_FONT,
      groupIds: [groupId],
      locked: true,
    },
  ];

  if (bodyText) {
    skeletons.push({
      type: "text",
      text: bodyText,
      x: x + PADDING,
      y: y + HEADER_HEIGHT + titleHeight + 18,
      width: CARD_WIDTH - PADDING * 2,
      fontSize: BODY_FONT,
      groupIds: [groupId],
      locked: true,
    });
  }

  skeletons.push({
    type: "text",
    text: "🔒 Your note – view only",
    x: x + PADDING,
    y: y + cardHeight - 22,
    width: CARD_WIDTH - PADDING * 2,
    fontSize: FOOTER_FONT,
    groupIds: [groupId],
    locked: true,
  });

  const elements = convertToExcalidrawElements(skeletons, { regenerateIds: true });
  elements.forEach((el) => {
    el.groupIds = [groupId];
    el.locked = true;
  });
  return elements;
}
