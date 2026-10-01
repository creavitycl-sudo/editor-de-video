import {ReelEditor} from "@/components/ReelEditor";

export default async function ReelPage({params}: {params: Promise<{id: string}>}) {
  const {id} = await params;
  return <ReelEditor reelId={id} />;
}
