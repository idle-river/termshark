import { AppPageShell } from "@/components/app-page-shell";
import { FloatingAddButton } from "@/components/floating-add-button";

export default function Page() {
  return (
    <>
      <FloatingAddButton ariaLabel="Add SSH Host" />
      <AppPageShell title="Home" />
    </>
  );
}
