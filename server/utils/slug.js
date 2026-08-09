// Menghasilkan id readable untuk rooms.id (VARCHAR PK, README/3-DBSchema.md §3.5), e.g. 'rm-alpha-strategy-room-4821'.
export function slugifyRoomId(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `rm-${base}-${suffix}`;
}
