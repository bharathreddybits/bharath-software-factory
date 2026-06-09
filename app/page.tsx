import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">Bharath Software Factory</h1>
        <p className="text-xl text-zinc-400 mb-8">AI-Native Product Factory Platform</p>
        <Button size="lg">
          <Link href="/dashboard">Get Started →</Link>
        </Button>
      </div>
    </div>
  );
}
