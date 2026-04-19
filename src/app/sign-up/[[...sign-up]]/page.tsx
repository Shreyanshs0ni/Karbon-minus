import { SignUp } from "@clerk/nextjs";
import { Nav } from "@/components/Nav";

export default function SignUpPage() {
  return (
    <>
      <Nav minimal />
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center bg-background px-4 py-12">
        <SignUp
          fallbackRedirectUrl="/projects"
          signInUrl="/sign-in"
          appearance={{
            variables: {
              colorPrimary: "#17cf97",
              colorBackground: "var(--glass-panel-bg)",
              colorInputBackground: "var(--input-bg)",
              colorText: "var(--foreground)",
              colorTextSecondary: "var(--muted-foreground)",
              borderRadius: "0.75rem",
            },
            elements: {
              rootBox: "mx-auto w-full max-w-md",
              card: "glass-panel border border-white/10 shadow-2xl dark:border-white/[0.08]",
              headerTitle: "text-foreground",
              headerSubtitle: "text-muted",
              socialButtonsBlockButton:
                "border-border bg-panel/80 backdrop-blur-sm",
              formButtonPrimary:
                "bg-accent hover:bg-accent text-[#06131d] font-semibold shadow-[0_0_24px_-8px_var(--accent-glow)]",
            },
          }}
        />
      </div>
    </>
  );
}
