import type {
  AnnouncementMediaArea,
  AnnouncementMediaHistoryItem,
  AnnouncementMediaHistoryMap,
  AnnouncementMediaOperationKind,
  AnnouncementMediaSourceOffset,
} from "@sigillus/contracts";

export function getMediaHistoryChain(
  currentSrc: string,
  historyMap: AnnouncementMediaHistoryMap,
): AnnouncementMediaHistoryItem[] {
  const chain: AnnouncementMediaHistoryItem[] = [];
  let cursor = currentSrc;
  let currentEntry = historyMap[cursor];

  while (currentEntry) {
    chain.push({
      src: cursor,
      entry: currentEntry,
    });
    cursor = currentEntry.parent;
    currentEntry = historyMap[cursor];
  }

  return chain.reverse();
}

export function hasOperationInHistory(
  currentSrc: string,
  historyMap: AnnouncementMediaHistoryMap,
  operation: AnnouncementMediaOperationKind,
): boolean {
  return getMediaHistoryChain(currentSrc, historyMap).some(
    (item) => item.entry.operation === operation,
  );
}

export function getCurrentMediaOffset(
  currentSrc: string,
  historyMap: AnnouncementMediaHistoryMap,
): AnnouncementMediaSourceOffset {
  const chain = getMediaHistoryChain(currentSrc, historyMap);
  const latestCrop = [...chain]
    .reverse()
    .find((item) => item.entry.operation === "edit" && item.entry.cropArea);

  if (!latestCrop || !latestCrop.entry.cropArea) {
    return { x: 0, y: 0 };
  }

  return {
    x: latestCrop.entry.cropArea.x,
    y: latestCrop.entry.cropArea.y,
  };
}

export function translateAreaToSource(
  area: AnnouncementMediaArea,
  sourceOffset: AnnouncementMediaSourceOffset,
): AnnouncementMediaArea {
  return {
    x: area.x - sourceOffset.x,
    y: area.y - sourceOffset.y,
    width: area.width,
    height: area.height,
  };
}

export function translateAreaFromSource(
  area: AnnouncementMediaArea,
  sourceOffset: AnnouncementMediaSourceOffset,
): AnnouncementMediaArea {
  return {
    x: sourceOffset.x + area.x,
    y: sourceOffset.y + area.y,
    width: area.width,
    height: area.height,
  };
}

export function planMediaUndo(
  currentSrc: string,
  historyMap: AnnouncementMediaHistoryMap,
  operation: AnnouncementMediaOperationKind,
): { baseSrc: string; remaining: AnnouncementMediaHistoryItem[] } | null {
  const chain = getMediaHistoryChain(currentSrc, historyMap);
  const targetIndex = chain.map((item) => item.entry.operation).lastIndexOf(operation);

  const first = chain[0];

  if (targetIndex === -1 || !first) {
    return null;
  }

  return {
    baseSrc: first.entry.parent,
    remaining: chain.filter((_, index) => index !== targetIndex),
  };
}
