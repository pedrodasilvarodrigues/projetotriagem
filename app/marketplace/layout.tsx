import { redirect } from "next/navigation";

export default function MarketplaceDevelopmentLayout() {
  redirect("/acesso-negado?recurso=prestadores-em-desenvolvimento");
}
