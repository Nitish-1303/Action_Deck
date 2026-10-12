import Home from "./home";

export const dynamic = "force-dynamic";

export default function Page() {
  const initialProvider = process.env.LLM_PROVIDER?.toLowerCase() === "groq"
    ? "groq"
    : "gemini";
  return <Home initialProvider={initialProvider} />;
}
