import { pageMetadata } from "@/lib/seo";
import ShareInvitation from "./share-invitation";
import "../partners.css";
import "./share.css";

export const metadata = pageMetadata("/share", "Invite a friend | Interaction Club", "Make your own personal invitation link. Good company starts with someone saying: come with me.");
export default function SharePage() { return <ShareInvitation/>; }
