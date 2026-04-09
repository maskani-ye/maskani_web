import dynamic from "next/dynamic";

const HomeClient = dynamic(() => import("./HomeClient"), { ssr: true });

export default function HomePage() {
  return <HomeClient />;
}
