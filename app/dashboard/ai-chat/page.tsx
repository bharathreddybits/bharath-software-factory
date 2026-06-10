import { redirect } from "next/navigation";
import factoryConfig from "@/src/config/factory.config";
import { AiChatClient } from "./_ai-chat-client";

export default function AiChatPage() {
  if (!factoryConfig.modules.aiFeatures) redirect("/dashboard");
  return <AiChatClient />;
}
