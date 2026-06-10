import Link from "next/link";
import { Button } from "@/components/ui/button";
import factoryConfig from "@/src/config/factory.config";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">{factoryConfig.product.name}</h1>
        <p className="text-xl text-zinc-400 mb-8">{factoryConfig.product.tagline}</p>
        <Button size="lg">
          <Link href="/dashboard">Get Started →</Link>
        </Button>
      </div>
    </div>
  );
}
