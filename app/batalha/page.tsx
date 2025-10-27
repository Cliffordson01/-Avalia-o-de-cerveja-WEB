import { getSupabaseServerClient } from "@/lib/supabase/server"
import { BattleArena } from "@/components/battle-arena"
import { Swords, Zap } from "lucide-react"

export default async function BattlePage() {
  const supabase = await getSupabaseServerClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get random beers for battle
  const { data: cervejas } = await supabase
    .from("cerveja")
    .select(
      `
      *,
      ranking:ranking!cerveja_id (*)
    `,
    )
    .limit(100)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <div className="mb-4 flex items-center justify-center gap-3">
          <Swords className="h-10 w-10 text-primary animate-bounce" />
          <h1 className="font-bebas text-6xl tracking-wide">Batalha VS</h1>
        </div>
        <p className="text-lg text-muted-foreground text-pretty leading-relaxed">
          Vote na sua favorita! Cada voto ajuda a definir o ranking das melhores cervejas.
        </p>
      </div>

      <BattleArena cervejas={cervejas || []} userId={user?.id} />
    </div>
  )
}
