import { getSheetSorter, makeOutput } from '@/_core/utils';

function defaultGetInternalLevelValueOf(sheet: Record<string, any>) {
  if (sheet.internalLevel === undefined) return undefined;
  if (sheet.internalLevel === null) return null;
  return Number(sheet.internalLevel.replace('?', ''));
}

export default async function run({
  songRecords,
  sheetRecords,
  categories,
  versions,
  types,
  difficulties,
  regions,
  getLevelValueOf,
  getInternalLevelValueOf = defaultGetInternalLevelValueOf,
  getIsSpecialOf,
}: {
  songRecords: Record<string, any>[],
  sheetRecords: Record<string, any>[],
  categories: Record<string, any>[],
  versions: Record<string, any>[],
  types: Record<string, any>[],
  difficulties: Record<string, any>[],
  regions: Record<string, any>[],
  getLevelValueOf: (sheet: any) => number | null,
  getInternalLevelValueOf?: (sheet: any) => number | null | undefined,
  getIsSpecialOf: (sheet: any) => boolean | null,
}) {
  const getSongVersion = (song: Record<string, any>) => {
    if (song.version != null) {
      return song.version;
    }
    if (song.releaseDate != null) {
      return versions.findLast(({ releaseDate }) => releaseDate <= song.releaseDate)?.version;
    }
    return undefined;
  };

  const getSortedSheetsOf = getSheetSorter(
    { types, difficulties },
  ).sorted;

  const songs = songRecords.map((song) => ({
    songId: song.songId,

    category: song.category ?? null,
    title: song.title ?? null,
    artist: song.artist ?? null,
    bpm: song.bpm ?? null,

    imageName: song.imageName ?? null,

    version: getSongVersion(song) ?? null,
    releaseDate: song.releaseDate ?? null,

    isNew: song.isNew != null ? Boolean(song.isNew) : null,
    isLocked: song.isLocked != null ? Boolean(song.isLocked) : null,

    comment: song.comment ?? null,

    sheets: getSortedSheetsOf(
      sheetRecords
        .filter((sheet) => sheet.songId === song.songId)
        .map((sheet) => ({
          type: sheet.type,
          difficulty: sheet.difficulty,

          level: sheet.level,
          levelValue: getLevelValueOf(sheet),

          internalLevel: sheet.internalLevel,
          internalLevelValue: getInternalLevelValueOf(sheet),

          noteDesigner: sheet.noteDesigner ?? null,

          noteCounts: sheet.noteCounts ?? undefined,

          regions: sheet.regions != null ? Object.fromEntries(
            [...Object.entries(sheet.regions)].map(
              ([region, value]) => [region, Boolean(value)],
            ),
          ) : undefined,
          regionOverrides: sheet.regionOverrides ?? undefined,

          isSpecial: getIsSpecialOf(sheet) ?? null,

          // optional sheet overrides
          version: sheet.version ?? undefined,
        })),
    ),
  }));

  const output = makeOutput({
    songs,
    categories,
    versions,
    types,
    difficulties,
    regions,
    updateTime: new Date().toISOString(),
  });

  return JSON.stringify(output, null, '\t');
}
