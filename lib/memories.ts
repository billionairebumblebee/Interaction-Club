export type ClubMemory = {
  id: string; title: string; date: string; blurb: string;
  status: "completed"; publicationApproved: boolean;
  photos: { src: string; alt: string; permissionConfirmed: boolean }[];
};

// Add an event only after it happens and its public blurb/photos are approved.
// No private roster, precise venue address, or future logistics belong here.
export const clubMemories: ClubMemory[] = [];
export function publishedMemories(now = new Date()) {
  return clubMemories.filter(memory => memory.status === "completed" && memory.publicationApproved && /^\d{4}-\d{2}-\d{2}$/.test(memory.date) && Date.parse(`${memory.date}T23:59:59-07:00`) < now.getTime()).map(memory => ({ ...memory, photos: memory.photos.filter(photo => photo.permissionConfirmed) }));
}
