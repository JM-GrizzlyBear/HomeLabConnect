import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-8 py-12 sm:px-16 md:w-1/2">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              HOSPITAL
            </h1>
            <p className="text-muted-foreground">Management Service</p>
          </div>
          <LoginForm />
        </div>
      </div>

      <div className="relative hidden w-1/2 flex-col items-center justify-center bg-secondary md:flex">
        {/* TODO: replace with the hospital illustration/icon graphic asset from login.png */}
        <div className="flex h-64 w-64 items-center justify-center rounded-full border-2 border-dashed border-primary/30 text-sm text-muted-foreground">
          Illustration placeholder
        </div>
        {/* TODO: add "Developed by" logo */}
        <div className="absolute bottom-8 text-sm text-muted-foreground">
          Developed by: {/* TODO: logo */}
        </div>
      </div>
    </div>
  );
}
