import { SignUp } from "@clerk/nextjs";
import { Nav } from "@/components/Nav";

export default function SignUpPage() {
  return (
    <>
      <Nav minimal />
      <div className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-4 py-12">
        <SignUp
          fallbackRedirectUrl="/projects"
          signInUrl="/sign-in"
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-lg",
            },
          }}
        />
      </div>
    </>
  );
}
