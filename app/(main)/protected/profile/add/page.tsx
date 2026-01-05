import { redirect } from "next/navigation";

export default function RedirectToAddProfilePage() {
  redirect("/protected/add-profile");
}
