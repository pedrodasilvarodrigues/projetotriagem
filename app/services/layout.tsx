import { redirect } from "next/navigation";

export default function ServicesDevelopmentLayout() {
  redirect("/acesso-negado?recurso=prestadores-em-desenvolvimento");
}
