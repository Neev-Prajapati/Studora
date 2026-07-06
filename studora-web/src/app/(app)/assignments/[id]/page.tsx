import { getAssignmentRoomDetails } from "@/actions/assignment";
import { notFound, redirect } from "next/navigation";
import AssignmentRoomView from "@/components/AssignmentRoomView";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function AssignmentRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getAssignmentRoomDetails(id);

  if (res.error === "Unauthorized" || res.error === "You are not a member of this room") {
    redirect("/assignments");
  }

  if (res.error === "Room not found" || !res.success) {
    notFound();
  }

  const { room, role, members, assignments, submittedAssignmentIds } = res;

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id;

  return (
    <AssignmentRoomView
      roomId={id}
      roomName={room?.name}
      roomDescription={room?.description}
      inviteCode={room?.inviteCode}
      role={role}
      members={members}
      assignments={assignments}
      submittedAssignmentIds={submittedAssignmentIds}
      currentUserId={currentUserId}
    />
  );
}
