import { canonicalDinnerId, createDinnerSession, DINNER_COOKIE, permitNameAttempt, readDinnerSession } from "@/lib/dinner-name-access";
import { GET as readInvitation, PATCH as updateInvitation } from "../../../table/[token]/route";
import { queueSheetRecord } from "@/lib/sheets";

const json = (body: unknown, status = 200) => Response.json(body,{status,headers:{"Cache-Control":"private, no-store","Vary":"Cookie"}});
type Context = {params:Promise<{dinnerId:string}>};
const sameOrigin = (request:Request) => request.headers.get("origin") === new URL(request.url).origin;
export async function POST(request:Request,context:Context) {
  if (!sameOrigin(request)) return json({error:"Please open this invitation on Interaction Club."},403);
  const dinnerId=canonicalDinnerId((await context.params).dinnerId);
  if (!dinnerId) return json({error:"We couldn’t open that invitation."},404);
  try {
    if (!(await permitNameAttempt(dinnerId,request))) return json({error:"Please wait 15 minutes before trying again."},429);
    const body=await request.json();
    const opened=await createDinnerSession(dinnerId,body?.name);
    if (!opened) return json({error:"That name couldn’t open this dinner. Use the first name on your signup, or ask Vivian to check your invitation."},403);
    try { await queueSheetRecord({id:opened.table.id,kind:"group",record:opened.table}); } catch { /* Event and session remain stored privately. */ }
    const response=json({ok:true});
    response.headers.set("Set-Cookie",`${DINNER_COOKIE}=${opened.sessionToken}; Path=/api/dinner/${dinnerId}; HttpOnly; SameSite=Strict; Max-Age=7200${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
    return response;
  } catch { return json({error:"We couldn’t open the invitation right now. Please try again or contact Vivian."},503); }
}
export async function GET(request:Request,context:Context) {
  const dinnerId=canonicalDinnerId((await context.params).dinnerId);
  if (!dinnerId) return json({error:"Invitation unavailable."},404);
  try {
    const opened=await readDinnerSession(dinnerId,request);
    if (!opened) return json({error:"Enter your invited first name to open the letter."},401);
    const response=await readInvitation(request,{params:Promise.resolve({token:opened.member.token})});
    if (!response.ok) return response;
    return json({...await response.json(),guestName:opened.session.guestName});
  } catch { return json({error:"Unable to load this invitation."},503); }
}
export async function PATCH(request:Request,context:Context) {
  if (!sameOrigin(request)) return json({error:"Please use your Interaction Club invitation."},403);
  const dinnerId=canonicalDinnerId((await context.params).dinnerId);
  if (!dinnerId) return json({error:"Invitation unavailable."},404);
  try {
    const opened=await readDinnerSession(dinnerId,request);
    if (!opened) return json({error:"Reopen the letter with your invited first name."},401);
    return updateInvitation(request,{params:Promise.resolve({token:opened.member.token})});
  } catch { return json({error:"We couldn’t save your response. Refresh before retrying."},503); }
}
