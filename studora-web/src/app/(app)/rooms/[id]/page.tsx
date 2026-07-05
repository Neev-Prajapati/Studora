import { getRoomDetails } from "@/actions/room";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import RoomView from "@/components/RoomView";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await getRoomDetails(id);

  if (res.error === "Unauthorized" || res.error === "You are not a member of this room") {
    redirect("/dashboard");
  }

  if (res.error === "Room not found" || !res.success) {
    notFound();
  }

  const { room, role, files, members } = res;

  // Get current user ID for client-side comparison (like deleting own files or not removing self)
  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id;

  return (
    <RoomView
      roomId={id}
      roomName={room?.name}
      roomDescription={room?.description}
      inviteCode={room?.inviteCode}
      role={role}
      files={files}
      members={members}
      currentUserId={currentUserId}
    />
  );
}
