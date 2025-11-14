"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  TrendingUp,
  Zap,
  Heart,
  MessageCircle,
  Trophy,
  Sparkles,
  X,
  Crown,
  RotateCw,
  Award,
  Calendar,
  Clock,
  Router,
} from "lucide-react";
import Image from "next/image";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { getBeerImageUrl } from "@/lib/utils";
import Link from "next/link";
import { RouterContext } from "next/dist/shared/lib/router-context.shared-runtime";
import router from "next/router";

const getPortugueseDayName = (date: Date): string => {
  const days = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ];
  return days[date.getDay()];
};

const startCountdown = () => {
  const updateCountdown = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    const distance = endOfDay.getTime() - now.getTime();

    if (distance < 0) {
      // Dia terminou - verificar se é domingo para mostrar vencedor semanal
      if (now.getDay() === 0) {
        // Domingo
        showWeeklyResults();
      }
      // Recarrega a página para pegar nova batalha
      router.reload();
      return;
    }

    const hours = Math.floor(distance / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const pad = (num: number) => String(num).padStart(2, "0");
    setTimeRemaining(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
  };

  updateCountdown();
  const interval = setInterval(updateCountdown, 1000);
  return () => clearInterval(interval);
};

const updateWeekProgress = () => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  // Progresso baseado nos dias que já passaram (considerando segunda como início)
  // Se for domingo (0), considerar 7 dias completos (100%)
  const dayIndex = dayOfWeek === 0 ? 7 : dayOfWeek;
  const weekProgressValue = Math.round((dayIndex / 7) * 100);
  setWeekProgress(weekProgressValue); // Corrigido
};

interface BattleArenaProps {
  cervejas: any[];
  userId?: string;
}

interface DailyBattleState {
  id: string;
  beer1: any;
  beer2: any;
  battle_date: string;
  votes_beer1: number;
  votes_beer2: number;
  winner_beer_id?: string;
  status: "active" | "finished";
  day_of_week: number;
}
interface WeeklyStats {
  total_votes: number;
  most_voted_beer: any | null;
  beer_stats: { [key: string]: number };
}

export function BattleArena({ cervejas, userId }: BattleArenaProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = getSupabaseBrowserClient();
  const [beer1, setBeer1] = useState<any>(null);
  const [beer2, setBeer2] = useState<any>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [battleCount, setBattleCount] = useState(0);
  const [showWinner, setShowWinner] = useState(false);
  const [winner, setWinner] = useState<any>(null);
  const [animateIn, setAnimateIn] = useState(false);
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set());
  const [userFavorites, setUserFavorites] = useState<Set<string>>(new Set());
  const [usedPairs, setUsedPairs] = useState<Set<string>>(new Set());
  const [dailyBattle, setDailyBattle] = useState<DailyBattleState | null>(null);
  const [currentDay, setCurrentDay] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState<string>("23h 59m 59s");
  const [weekProgress, setWeekProgress] = useState<number>(0);
  const [showWeeklyWinner, setShowWeeklyWinner] = useState(false);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats | null>(null);
  const [userDailyVote, setUserDailyVote] = useState<string | null>(null);

  useEffect(() => {
    if (cervejas.length >= 2) {
      loadUserInteractions();
      initializeDailyBattle();
    }
  }, [cervejas]);

  useEffect(() => {
    setAnimateIn(true);
    const timer = setTimeout(() => setAnimateIn(false), 1000);
    return () => clearTimeout(timer);
  }, [beer1, beer2]);

  // Inicializar ou carregar batalha diária
  const initializeDailyBattle = async () => {
    try {
      const today = new Date().toDateString();
      setCurrentDay(getPortugueseDayName(new Date()));

      // Verificar se já existe uma batalha diária para hoje
      const { data: existingBattle, error } = await supabase
        .from("batalha_diaria")
        .select("*")
        .eq("data_batalha", new Date().toISOString().split("T")[0])
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Erro ao buscar batalha diária:", error);
      }

      if (existingBattle) {
        // Carregar batalha existente
        const beer1 = cervejas.find(
          (b) => b.uuid === existingBattle.cerveja1_id
        );
        const beer2 = cervejas.find(
          (b) => b.uuid === existingBattle.cerveja2_id
        );

        if (beer1 && beer2) {
          setDailyBattle({
            id: existingBattle.uuid,
            beer1,
            beer2,
            battle_date: existingBattle.data_batalha,
            votes_beer1: existingBattle.votos_cerveja1,
            votes_beer2: existingBattle.votos_cerveja2,
            winner_beer_id: existingBattle.vencedor_id,
            status: existingBattle.status,
            day_of_week: existingBattle.dia_da_semana,
          });
          setBeer1(beer1);
          setBeer2(beer2);
          startCountdown();
          updateWeekProgress();
          return;
        }
      }

      // Criar nova batalha diária
      await createNewDailyBattle();
    } catch (error) {
      console.error("Erro ao inicializar batalha diária:", error);
      // Fallback para seleção aleatória
      selectRandomBeersForToday();
    }
  };

  // Criar nova batalha diária
  const createNewDailyBattle = async () => {
    if (cervejas.length < 2) return;

    const newBeer1 = selectRandomBeer();
    let newBeer2 = selectRandomBeer();

    // Garantir que são cervejas diferentes
    while (newBeer2.uuid === newBeer1.uuid && cervejas.length > 1) {
      newBeer2 = selectRandomBeer();
    }

    const today = new Date();
    const battleDate = today.toISOString().split("T")[0];
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado

    try {
      const { data: newBattle, error } = await supabase
        .from("batalha_diaria")
        .insert({
          cerveja1_id: newBeer1.uuid,
          cerveja2_id: newBeer2.uuid,
          data_batalha: battleDate,
          dia_da_semana: dayOfWeek,
          votos_cerveja1: 0,
          votos_cerveja2: 0,
          status: "active",
        })
        .select()
        .single();

      if (error) {
        console.error("ERRO DETALHADO SUPABASE:", error);
        throw new Error(
          error.message || "Falha na inserção da batalha diária."
        );
      }
      setDailyBattle({
        id: newBattle.uuid,
        beer1: newBeer1,
        beer2: newBeer2,
        battle_date: battleDate,
        votes_beer1: 0,
        votes_beer2: 0,
        status: "active",
        day_of_week: dayOfWeek,
        winner_beer_id: undefined,
      });

      setBeer1(newBeer1);
      setBeer2(newBeer2);
      startCountdown();
      updateWeekProgress();
    } catch (error) {
      console.error("Erro ao criar batalha diária:", error);
      selectRandomBeersForToday();
    }
  };

  // Selecionar cerveja aleatória considerando as usadas recentemente
  const selectRandomBeer = () => {
    // Preferir cervejas que não foram usadas recentemente
    const recentBattles = JSON.parse(
      localStorage.getItem("recentBattles") || "[]"
    );
    const availableBeers = cervejas.filter(
      (beer) => !recentBattles.includes(beer.uuid)
    );

    const targetBeers = availableBeers.length >= 2 ? availableBeers : cervejas;
    const randomIndex = Math.floor(Math.random() * targetBeers.length);
    return targetBeers[randomIndex];
  };

  const selectRandomBeersForToday = () => {
    const newBeer1 = selectRandomBeer();
    let newBeer2 = selectRandomBeer();

    while (newBeer2.uuid === newBeer1.uuid && cervejas.length > 1) {
      newBeer2 = selectRandomBeer();
    }

    setBeer1(newBeer1);
    setBeer2(newBeer2);

    // Salvar no localStorage para evitar repetição
    const recentBattles = JSON.parse(
      localStorage.getItem("recentBattles") || "[]"
    );
    const newRecent = [newBeer1.uuid, newBeer2.uuid, ...recentBattles].slice(
      0,
      10
    );
    localStorage.setItem("recentBattles", JSON.stringify(newRecent));

    startCountdown();
    updateWeekProgress();
  };

  // Contador regressivo para o fim do dia
  const startCountdown = () => {
    const updateCountdown = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const distance = endOfDay.getTime() - now.getTime();

      if (distance < 0) {
        // Dia terminou - verificar se é domingo para mostrar vencedor semanal
        if (now.getDay() === 0) {
          // Domingo
          showWeeklyResults();
        }
        // Nova batalha será carregada no próximo render
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  };

  // Atualizar progresso da semana
  const updateWeekProgress = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
    // Progresso baseado nos dias que já passaram (considerando segunda como início)
    const weekProgress =
      dayOfWeek === 0 ? 100 : Math.round((dayOfWeek / 7) * 100);
    setWeekProgress(weekProgress);
  };

  // Mostrar resultados semanais (domingo)
  const showWeeklyResults = async () => {
    try {
      // Buscar estatísticas da semana
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7); // Últimos 7 dias

      const { data: weeklyBattles, error } = await supabase
        .from("batalha_diaria")
        .select("*, cerveja1_id, cerveja2_id, votos_cerveja1, votos_cerveja2")
        .gte("data_batalha", startOfWeek.toISOString().split("T")[0]);

      if (error) throw error;

      // Calcular estatísticas
      const beerStats: { [key: string]: number } = {};
      let totalVotes = 0;

      weeklyBattles?.forEach(
        (battle: {
          cerveja1_id: string | number;
          votos_cerveja1: number;
          cerveja2_id: string | number;
          votos_cerveja2: number;
        }) => {
          beerStats[battle.cerveja1_id] =
            (beerStats[battle.cerveja1_id] || 0) + battle.votos_cerveja1;
          beerStats[battle.cerveja2_id] =
            (beerStats[battle.cerveja2_id] || 0) + battle.votos_cerveja2;
          totalVotes += battle.votos_cerveja1 + battle.votos_cerveja2;
        }
      );

      // Encontrar cerveja mais votada
      let mostVotedBeerId: string | null = null;
      let maxVotes = 0;

      Object.entries(beerStats).forEach(([beerId, votes]) => {
        if (votes > maxVotes) {
          maxVotes = votes;
          mostVotedBeerId = beerId;
        }
      });

      const mostVotedBeer = mostVotedBeerId
        ? cervejas.find((b) => b.uuid === mostVotedBeerId)
        : null;

      // Incrementar Taça Breja na tabela RANKING
      if (mostVotedBeerId) {
        // Primeiro verificar se já existe ranking para esta cerveja
        const { data: existingRanking, error: checkError } = await supabase
          .from("ranking")
          .select("taças_breja")
          .eq("cerveja_id", mostVotedBeerId)
          .single();

        if (checkError && checkError.code !== "PGRST116") {
          console.error("Erro ao verificar ranking:", checkError);
        }

        const currentTaças = existingRanking?.taças_breja || 0;

        // Fazer UPSERT na tabela ranking
        const { error: updateError } = await supabase.from("ranking").upsert(
          {
            cerveja_id: mostVotedBeerId,
            taças_breja: currentTaças + 1,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "cerveja_id",
          }
        );

        if (updateError) {
          console.error(
            "Erro ao atualizar Taça Breja no ranking:",
            updateError
          );
        } else {
          console.log(`🏆 Taça Breja incrementada para ${mostVotedBeer?.nome}`);

          // Atualizar também o estado local se a cerveja estiver na batalha atual
          if (
            beer1?.uuid === mostVotedBeerId ||
            beer2?.uuid === mostVotedBeerId
          ) {
            router.refresh(); // Recarregar dados
          }
        }
      }

      setWeeklyStats({
        total_votes: totalVotes,
        most_voted_beer: mostVotedBeer,
        beer_stats: beerStats,
      });

      setShowWeeklyWinner(true);

      const currentTaças = mostVotedBeer?.ranking?.[0]?.taças_breja || 0;
      toast({
        title: "🏆 Taça Breja Conquistada!",
        description: `${
          mostVotedBeer?.nome || "N/A"
        } ganhou +1 Taça Breja! Total: ${currentTaças + 1}`,
      });
    } catch (error) {
      console.error("Erro ao buscar resultados semanais:", error);
    }
  };

  const getPortugueseDayName = (date: Date): string => {
    const days = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    return days[date.getDay()];
  };

  const loadUserInteractions = async () => {
    if (!userId) return;

    try {
      const today = new Date().toISOString().split("T")[0];

      const [votesResponse, favoritesResponse, dailyVotesResponse] =
        await Promise.all([
          supabase
            .from("voto")
            .select("cerveja_id")
            .eq("usuario_id", userId)
            .eq("deletado", false)
            .eq("status", true),
          supabase
            .from("favorito")
            .select("cerveja_id")
            .eq("usuario_id", userId)
            .eq("deletado", false)
            .eq("status", true),
          supabase
            .from("voto_diario")
            .select("cerveja_id")
            .eq("usuario_id", userId)
            .eq("data_voto", today),
        ]);

      if (votesResponse.data) {
        setUserVotes(
          new Set(
            votesResponse.data.map((v: { cerveja_id: string }) => v.cerveja_id)
          )
        );
      }
      if (favoritesResponse.data) {
        setUserFavorites(
          new Set(
            favoritesResponse.data.map(
              (f: { cerveja_id: string }) => f.cerveja_id
            )
          )
        );
      }
      if (dailyVotesResponse.data && dailyVotesResponse.data.length > 0) {
        setUserDailyVote(dailyVotesResponse.data[0].cerveja_id);
      }
    } catch (error) {
      console.error("Erro ao carregar interações:", error);
    }
  };

  const handleVote = async (beerId: string) => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para votar.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    // Verificar se já votou hoje
    const today = new Date().toISOString().split("T")[0];
    console.log("🗳️ Iniciando processo de voto para:", {
      userId,
      today,
      beerId,
    });

    const hasVotedToday = await checkDailyVote(userId, today);
    console.log("✅ Resultado da verificação:", hasVotedToday);

    if (hasVotedToday) {
      // Agora temos informação sobre qual cerveja foi votada
      if (userDailyVote) {
        const votedBeer = cervejas.find((b) => b.uuid === userDailyVote);
        toast({
          title: "Voto já realizado",
          description: `Você já votou em ${
            votedBeer?.nome || "uma cerveja"
          } hoje!`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Voto já realizado hoje",
          description: "Você já votou na batalha de hoje. Volte amanhã!",
          variant: "destructive",
        });
      }
      return;
    }

    setLoading(beerId);

    try {
      // Registrar voto diário
      const { error: dailyVoteError } = await supabase
        .from("voto_diario")
        .insert({
          usuario_id: userId,
          cerveja_id: beerId,
          data_voto: today,
          batalha_diaria_id: dailyBattle?.id,
        });

      if (dailyVoteError) throw dailyVoteError;

      // Atualizar batalha diária se existir
      if (setDailyBattle) {
        if (!dailyBattle) {
          setLoading(null);
          toast({
            title: "Erro",
            description: "Batalha diária não encontrada.",
            variant: "destructive",
          });
          return;
        }
        const isBeer1 = beerId === dailyBattle.beer1.uuid;
        const updateField = isBeer1 ? "votos_cerveja1" : "votos_cerveja2";

        const { error: updateError } = await supabase
          .from("batalha_diaria")
          .update({
            [updateField]:
              dailyBattle[isBeer1 ? "votes_beer1" : "votes_beer2"] + 1,
          })
          .eq("uuid", dailyBattle.id);

        if (updateError) throw updateError;

        if (dailyVoteError) {
          // Se for erro de duplicação, significa que já votou
          if (dailyVoteError.code === "23505") {
            toast({
              title: "Voto já realizado",
              description: "Você já votou na batalha de hoje!",
              variant: "destructive",
            });
            return;
          }
          throw dailyVoteError;
        }
        console.log("✅ Voto registrado com sucesso para:", beerId);

        // Atualizar estado local
        setDailyBattle((prev) =>
          prev
            ? {
                ...prev,
                votes_beer1: isBeer1 ? prev.votes_beer1 + 1 : prev.votes_beer1,
                votes_beer2: !isBeer1 ? prev.votes_beer2 + 1 : prev.votes_beer2,
              }
            : null
        );
      }

      // Mostrar vencedor
      const winnerBeer = beerId === beer1.uuid ? beer1 : beer2;
      setWinner(winnerBeer);
      setShowWinner(true);

      toast({
        title: "🗳️ Voto registrado!",
        description: `Você escolheu ${winnerBeer.nome} na batalha de hoje!`,
      });

      // Atualizar contagem
      setTimeout(() => {
        setBattleCount((prev) => prev + 1);
        setShowWinner(false);
        router.refresh();
      }, 2000);

      setUserDailyVote(beerId);
    } catch (error: any) {
      console.error("Erro ao votar:", error);
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const checkDailyVote = async (
    userId: string,
    date: string
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("voto_diario")
        .select("*")
        .eq("usuario_id", userId)
        .eq("data_voto", date);

      if (error) {
        console.error("❌ ERRO na consulta:", error);
        return false; // Não bloqueia em caso de erro
      }

      const hasVoted = data && data.length > 0;
      console.log("📊 Resultado da verificação:", {
        hasVoted,
        votosEncontrados: data,
      });

      return hasVoted;
    } catch (error) {
      console.error("ERRO INESPERADO:", error);
      return true;
    }
  };

  useEffect(() => {
    if (cervejas.length >= 2) {
      loadUserInteractions();
      selectRandomBeers();
    }
  }, [cervejas]);

  useEffect(() => {
    setAnimateIn(true);
    const timer = setTimeout(() => setAnimateIn(false), 1000);
    return () => clearTimeout(timer);
  }, [beer1, beer2]);

  // Selecionar duas cervejas aleatórias para batalha
  const selectRandomBeers = () => {
    if (cervejas.length < 2) return;

    const availableCervejas = cervejas.filter(
      (cerveja) =>
        !usedPairs.has(getPairKey(beer1, cerveja)) &&
        !usedPairs.has(getPairKey(beer2, cerveja))
    );

    if (availableCervejas.length < 2) {
      setUsedPairs(new Set());
      selectRandomBeers();
      return;
    }

    const shuffled = [...availableCervejas].sort(() => Math.random() - 0.5);
    const newBeer1 = shuffled[0];
    const newBeer2 = shuffled[1];

    setBeer1(newBeer1);
    setBeer2(newBeer2);
    setShowWinner(false);
    setWinner(null);

    const pairKey = getPairKey(newBeer1, newBeer2);
    setUsedPairs((prev) => new Set([...prev, pairKey]));
  };

  const getPairKey = (beerA: any, beerB: any) => {
    const ids = [beerA?.uuid, beerB?.uuid].sort();
    return ids.join("_");
  };

  const cancelVote = async (beerId: string) => {
    if (!userId) return;

    setLoading(beerId);

    try {
      const { error } = await supabase
        .from("voto")
        .update({
          deletado: true,
          status: false,
        })
        .eq("usuario_id", userId)
        .eq("cerveja_id", beerId)
        .eq("deletado", false);

      if (error) throw error;

      setUserVotes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(beerId);
        return newSet;
      });

      toast({
        title: "Voto removido",
        description: "Seu voto foi cancelado.",
      });

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao cancelar o voto.",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
    }
  };

  const toggleFavorite = async (beerId: string) => {
    if (!userId) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para favoritar.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    try {
      if (userFavorites.has(beerId)) {
        const { error } = await supabase
          .from("favorito")
          .update({ deletado: true })
          .eq("usuario_id", userId)
          .eq("cerveja_id", beerId)
          .eq("deletado", false);

        if (error) throw error;

        setUserFavorites((prev) => {
          const newSet = new Set(prev);
          newSet.delete(beerId);
          return newSet;
        });

        toast({
          title: "Removido dos favoritos",
          description: "Cerveja removida da sua lista.",
        });
      } else {
        const { error } = await supabase.from("favorito").upsert(
          {
            usuario_id: userId,
            cerveja_id: beerId,
            status: true,
            deletado: false,
            criado_em: new Date().toISOString(),
          },
          {
            onConflict: "usuario_id,cerveja_id",
          }
        );

        if (error) throw error;

        setUserFavorites((prev) => new Set([...prev, beerId]));

        toast({
          title: "⭐ Adicionado aos favoritos!",
          description: "Cerveja salva na sua lista.",
        });
      }

      router.refresh();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro.",
        variant: "destructive",
      });
    }
  };

  const getRankingData = (beer: any) => {
    if (!beer.ranking)
      return {
        media_avaliacao: 0,
        total_votos: 0,
        total_favoritos: 0,
        total_comentarios: 0,
        taças_breja: 0,
      };

    const ranking = Array.isArray(beer.ranking)
      ? beer.ranking[0]
      : beer.ranking;
    return {
      media_avaliacao: Number(ranking?.media_avaliacao) || 0,
      total_votos: Number(ranking?.total_votos) || 0,
      total_favoritos: Number(ranking?.total_favoritos) || 0,
      total_comentarios: Number(ranking?.total_comentarios) || 0,
      taças_breja: Number(ranking?.taças_breja) || 0,
    };
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const getVotePercentage = (beer: any, totalVotos: number) => {
    if (totalVotos === 0) return 0;
    const ranking = getRankingData(beer);
    return Math.round((ranking.total_votos / totalVotos) * 100);
  };

  if (!beer1 || !beer2) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="p-12 text-center">
          <Zap className="mx-auto mb-4 h-16 w-16 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-lg">
            Não há cervejas suficientes para batalha.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Adicione mais cervejas para começar as batalhas!
          </p>
        </CardContent>
      </Card>
    );
  }

  const ranking1 = getRankingData(beer1);
  const ranking2 = getRankingData(beer2);
  const totalVotos = ranking1.total_votos + ranking2.total_votos;
  const votePercentage1 = getVotePercentage(beer1, totalVotos);
  const votePercentage2 = getVotePercentage(beer2, totalVotos);

  const hasVoted1 = userVotes.has(beer1.uuid);
  const hasVoted2 = userVotes.has(beer2.uuid);
  const isFavorite1 = userFavorites.has(beer1.uuid);
  const isFavorite2 = userFavorites.has(beer2.uuid);

  const isBeer1Loading = loading === beer1.uuid;
  const isBeer2Loading = loading === beer2.uuid;

  // Calcular porcentagens para a batalha diária
  const dailyTotalVotes =
    (dailyBattle?.votes_beer1 || 0) + (dailyBattle?.votes_beer2 || 0);
  const dailyPercentage1 =
    dailyTotalVotes > 0
      ? Math.round(((dailyBattle?.votes_beer1 || 0) / dailyTotalVotes) * 100)
      : 50;
  const dailyPercentage2 =
    dailyTotalVotes > 0
      ? Math.round(((dailyBattle?.votes_beer2 || 0) / dailyTotalVotes) * 100)
      : 50;

  return (
    <div className="space-y-8">
      {/* Header da Batalha Diária */}
      <div
        className={`text-center space-y-4 transition-all duration-500 ${
          animateIn ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="flex items-center justify-center gap-3">
          <Calendar className="h-7 w-7 text-yellow-500" />
          <h1 className="font-bebas text-5xl md:text-6xl tracking-wide bg-gradient-to-r from-yellow-600 via-red-400 to-red-600 bg-clip-text text-transparent">
            BATALHA DIÁRIA
          </h1>
          <RotateCw className="h-7 w-7 text-blue-500" />
        </div>

        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-600 to-red-500 rounded-full text-white font-semibold shadow-lg">
            <Clock className="h-4 w-4" />
            <span>
              Hoje é {currentDay} - Termina em: {timeRemaining}
            </span>
          </div>

          {/* Barra de Progresso da Semana */}
          <div className="max-w-md mx-auto">
            <div className="flex justify-between text-sm text-muted-foreground mb-1">
              <span>Progresso da Semana</span>
              <span>{weekProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-orange-500 to-red-300 h-2 rounded-full transition-all duration-500"
                style={{ width: `${weekProgress}%` }}
              ></div>
            </div>
          </div>

          {dailyTotalVotes > 0 && (
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span>Votos hoje: {dailyTotalVotes}</span>
              </div>
            </div>
          )}
        </div>

        <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
          <span className="font-bold bg-gradient-to-r from-[rgb(255_165_0)] to-[rgb(255_0_128)] bg-clip-text text-transparent">
            Nova batalha todos os dias!
          </span>{" "}
          Escolha a cerveja que merece vencer hoje.
          <span className="font-semibold text-yellow-600">
            {" "}
            Você pode votar uma vez por dia
          </span>
          . Resultado semanal aos domingos!
        </p>
      </div>

      {/* Vencedor Semanal (Domingo) */}
      {showWeeklyWinner && weeklyStats && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-3xl p-8 max-w-2xl mx-4 text-center shadow-2xl animate-in zoom-in duration-500">
            <div className="animate-bounce mb-4">
              <div className="relative">
                <Award className="h-24 w-24 text-yellow-600 mx-auto" />
                <Crown className="h-12 w-12 text-yellow-400 absolute -top-4 -right-4" />
              </div>
            </div>
            <h3 className="text-4xl font-bebas mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              🏆 VENCEDOR DA SEMANA! 🏆
            </h3>

            {weeklyStats.most_voted_beer ? (
              <>
                <div className="mb-6">
                  <p className="text-2xl font-bold mb-2">
                    {weeklyStats.most_voted_beer.nome}
                  </p>
                  <p className="text-muted-foreground text-lg mb-4">
                    {weeklyStats.most_voted_beer.marca}
                  </p>

                  <div className="flex justify-center gap-6 text-sm mb-6">
                    <Badge className="bg-yellow-500 text-white text-base px-4 py-2 border-2 border-yellow-300 animate-bounce">
                      🏆 +1 Taça Breja!
                    </Badge>

                    <Badge variant="secondary" className="text-base px-4 py-2">
                      Total:{" "}
                      {(weeklyStats.most_voted_beer.ranking?.[0]?.taças_breja ||
                        0) + 1}{" "}
                      Taças
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Button
                    onClick={() => setShowWeeklyWinner(false)}
                    variant="outline"
                    className="h-12"
                  >
                    Fechar
                  </Button>
                  <Button
                    onClick={() => {
                      setShowWeeklyWinner(false);
                      router.push(
                        `/cerveja/${weeklyStats.most_voted_beer.uuid}`
                      );
                    }}
                    className="h-12 bg-gradient-to-r from-yellow-500 to-orange-500"
                  >
                    Ver Cerveja
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">
                Nenhum voto foi registrado esta semana.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Winner Animation do Voto Diário */}
      {showWinner && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="from-card to-yellow-500/10 border-2 border-black-500 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl animate-in zoom-in duration-500">
            <div className="animate-bounce mb-4">
              <div className="relative">
                <Trophy className="h-20 w-20 text-green-500 mx-auto" />
                <Sparkles className="h-8 w-8 text-green-300 absolute -top-2 -right-2" />
              </div>
            </div>
            <h3 className="text-3xl font-bebas mb-3 bg-gradient-to-r from-yellow-500 to-red-500 bg-clip-text text-transparent">
              🗳️ VOTO REGISTRADO! 🗳️
            </h3>
            <p className="text-xl font-bold mb-2">{winner.nome}</p>
            <p className="text-muted-foreground mb-4">
              sua escolha de hoje foi registrada!
            </p>
            <div className="w-full bg-secondary rounded-full h-2">
              <div className="bg-gradient-to-r from-yellow-500 to-red-500 h-2 rounded-full transition-all duration-1000 animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* Battle Arena */}
      <div className="grid gap-6 lg:gap-8 lg:grid-cols-2 relative">
        {/* VS Badge */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-red-500 rounded-full blur-md opacity-75 animate-pulse"></div>
            <Badge className="relative bg-gradient-to-r from-red-500 to-yellow-500 text-white px-8 py-4 text-xl font-bebas border-4 border-background shadow-2xl">
              VS
            </Badge>
          </div>
        </div>

        {/* Beer 1 */}
        <div
          className={`transition-all duration-500 ${
            animateIn ? "opacity-0 -translate-x-8" : "opacity-100 translate-x-0"
          }`}
        >
          <Card
            className={`beer-card group transition-all duration-300 relative overflow-hidden border-2 ${"border-border hover:border-green-500 hover:shadow-xl"} ${
              loading === beer1.uuid ? "animate-pulse" : ""
            }`}
          >
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border shadow-md hover:scale-110 transition-transform"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(beer1.uuid);
              }}
              disabled={!!loading}
            >
              <Heart
                className={`h-5 w-5 transition-all ${
                  isFavorite1
                    ? "fill-red-500 text-yellow-500 scale-110 animate-pulse"
                    : "text-muted-foreground hover:text-red-500 hover:scale-110"
                }`}
              />
            </Button>

            {/* Daily Vote Percentage */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-green-500 text-white px-3 py-1 font-bold border-2 border-white">
                {dailyPercentage1}%
              </Badge>
            </div>

            {/* Daily Votes Count */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10">
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm px-2 py-1 text-xs"
              >
                {dailyBattle?.votes_beer1 || 0} votos
              </Badge>
            </div>

            <Link
              href={`/cerveja/${beer1.uuid}`}
              className="block cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-muted/50">
                  <Image
                    src={
                      getBeerImageUrl(beer1.imagem_url || beer1.imagem_main) ||
                      "/placeholder.svg"
                    }
                    alt={beer1.nome}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bebas text-3xl tracking-wide text-balance leading-tight">
                      {beer1.nome}
                    </h3>
                    <p className="text-muted-foreground font-medium">
                      {beer1.marca}
                    </p>
                  </div>

                  {beer1.estilo && (
                    <Badge variant="secondary" className="text-xs">
                      {beer1.estilo}
                    </Badge>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                      <div>
                        <div className="font-bold">
                          {ranking1.media_avaliacao.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          avaliação
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">
                          {formatNumber(ranking1.total_votos)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          votos
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        ranking1.taças_breja > 0
                          ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
                          : "bg-muted/50"
                      }`}
                    >
                      <Trophy
                        className={`h-4 w-4 shrink-0 ${
                          ranking1.taças_breja > 0
                            ? "text-yellow-600 fill-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <div
                          className={`font-bold ${
                            ranking1.taças_breja > 0 ? "text-yellow-700" : ""
                          }`}
                        >
                          {ranking1.taças_breja || 0}
                        </div>
                        <div
                          className={`text-xs ${
                            ranking1.taças_breja > 0
                              ? "text-yellow-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          Taças Breja
                        </div>
                      </div>
                    </div>
                    {beer1.estilo && (
                      <Badge variant="secondary" className="text-xs">
                        {beer1.estilo}
                      </Badge>
                    )}

                    {ranking1.taças_breja > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1">
                          🏆 {ranking1.taças_breja} Taça
                          {ranking1.taças_breja > 1 ? "s" : ""} Breja
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">
                          {formatNumber(ranking1.total_comentarios)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          comentários
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Heart className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">
                          {formatNumber(ranking1.total_favoritos)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          favoritos
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>

            <div className="px-6 pb-6">
              <Button
                className="w-full h-12 text-base font-semibold transition-all duration-200 relative overflow-hidden text-black-100 hover:shadow-md hover:shadow-lg bg-gradient-to-r from-yellow-500 to-amber-400
                hover:from-amber-400 hover:to-orange-600"
                size="lg"
                disabled={!!loading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVote(beer1.uuid);
                }}
              >
                {isBeer1Loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : userDailyVote ? (
                  <div className="flex items-center gap-2 opacity-80">
                    <Calendar className="h-5 w-5" />
                    Já Votou Hoje
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Votar
                  </div>
                )}
              </Button>
            </div>
          </Card>
        </div>

        {/* Beer 2 */}
        <div
          className={`transition-all duration-500 delay-100 ${
            animateIn ? "opacity-0 translate-x-8" : "opacity-100 translate-x-0"
          }`}
        >
          <Card
            className={`beer-card group transition-all duration-300 relative overflow-hidden border-2 ${"border-border hover:border-blue-500 hover:shadow-xl"} ${
              loading === beer2.uuid ? "animate-pulse" : ""
            }`}
          >
            {/* Favorite Button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-3 right-3 z-20 h-9 w-9 rounded-full bg-background/80 backdrop-blur-sm border shadow-md hover:scale-110 transition-transform"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleFavorite(beer2.uuid);
              }}
              disabled={!!loading}
            >
              <Heart
                className={`h-5 w-5 transition-all ${
                  isFavorite2
                    ? "fill-red-500 text-red-500 scale-110 animate-pulse"
                    : "text-muted-foreground hover:text-red-500 hover:scale-110"
                }`}
              />
            </Button>

            {/* Daily Vote Percentage */}
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-10">
              <Badge className="bg-blue-500 text-white px-3 py-1 font-bold border-2 border-white">
                {dailyPercentage2}%
              </Badge>
            </div>

            {/* Daily Votes Count */}
            <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-10">
              <Badge
                variant="secondary"
                className="bg-background/80 backdrop-blur-sm px-2 py-1 text-xs"
              >
                {dailyBattle?.votes_beer2 || 0} votos
              </Badge>
            </div>

            <Link
              href={`/cerveja/${beer2.uuid}`}
              className="block cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-muted/50">
                  <Image
                    src={
                      getBeerImageUrl(beer2.imagem_url || beer2.imagem_main) ||
                      "/placeholder.svg"
                    }
                    alt={beer2.nome}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bebas text-3xl tracking-wide text-balance leading-tight">
                      {beer2.nome}
                    </h3>
                    <p className="text-muted-foreground font-medium">
                      {beer2.marca}
                    </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Star className="h-4 w-4 fill-primary text-primary shrink-0" />
                      <div>
                        <div className="font-bold">
                          {ranking2.media_avaliacao.toFixed(1)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          avaliação
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">
                          {formatNumber(ranking2.total_votos)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          votos
                        </div>
                      </div>
                    </div>

                    <div
                      className={`flex items-center gap-2 p-2 rounded-lg ${
                        ranking2.taças_breja > 0
                          ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
                          : "bg-muted/50"
                      }`}
                    >
                      <Trophy
                        className={`h-4 w-4 shrink-0 ${
                          ranking2.taças_breja > 0
                            ? "text-yellow-600 fill-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                      <div>
                        <div
                          className={`font-bold ${
                            ranking2.taças_breja > 0 ? "text-yellow-700" : ""
                          }`}
                        >
                          {ranking2.taças_breja || 0}
                        </div>
                        <div
                          className={`text-xs ${
                            ranking2.taças_breja > 0
                              ? "text-yellow-600"
                              : "text-muted-foreground"
                          }`}
                        >
                          Taças Breja
                        </div>
                      </div>
                    </div>
                    {beer2.estilo && (
                      <Badge variant="secondary" className="text-xs">
                        {beer2.estilo}
                      </Badge>
                    )}

                    {beer2.estilo && (
                      <Badge variant="secondary" className="text-xs">
                        {beer2.estilo}
                      </Badge>
                    )}

                    {ranking2.taças_breja > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1">
                          🏆{ranking2.taças_breja} Taça
                          {ranking2.taças_breja} Taça
                          {ranking2.taças_breja > 1 ? "s" : ""} Breja
                        </Badge>
                      </div>
                    )}

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <MessageCircle className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">
                          {formatNumber(ranking2.total_comentarios)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          comentários
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Heart className="h-4 w-4 shrink-0" />
                      <div>
                        <div className="font-bold">
                          {formatNumber(ranking2.total_favoritos)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          favoritos
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>

            <div className="px-6 pb-6">
              <Button
                className="w-full h-12 text-base font-semibold transition-all duration-200 relative overflow-hidden text-black-100 hover:shadow-md hover:shadow-lg bg-gradient-to-r from-yellow-500 to-amber-400
                hover:from-amber-400 hover:to-orange-600"
                size="lg"
                disabled={!!loading}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleVote(beer2.uuid);
                }}
              >
                {isBeer2Loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando...
                  </div>
                ) : userDailyVote === beer2.uuid ? (
                  <div className="flex items-center gap-2 animate-pulse">
                    <Trophy className="h-5 w-5" />
                    Votado! 🎉
                  </div>
                ) : userDailyVote ? (
                  <div className="flex items-center gap-2 opacity-80">
                    <Calendar className="h-5 w-5" />
                    Já Votou Hoje
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Votar
                  </div>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Info Footer */}
      <div
        className={`text-center transition-all duration-500 delay-200 ${
          animateIn ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`}
      >
        <div className="bg-muted/50 rounded-lg p-4 max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
            <div className="flex items-center justify-center gap-2">
              <Calendar className="h-4 w-4" />
              <p>
                <span className="font-semibold">Batalha Diária:</span> Vote uma
                vez por dia
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <RotateCw className="h-4 w-4" />
              <p>
                <span className="font-semibold">Nova Combinação:</span> Todo dia
                às 00:00
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Award className="h-4 w-4" />
              <p>
                <span className="font-semibold">Resultado Semanal:</span>{" "}
                Domingo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function setDailyBattle(arg0: {
  id: any;
  beer1: any;
  beer2: any;
  battle_date: any;
  votes_beer1: any;
  votes_beer2: any;
  winner_beer_id: any;
  status: any;
  day_of_week: any;
}) {
  throw new Error("Function not implemented.");
}
function setCurrentDay(arg0: string) {
  throw new Error("Function not implemented.");
}

function setTimeRemaining(arg0: string) {
  throw new Error("Function not implemented.");
}

function setWeekProgress(weekProgressValue: number) {
  throw new Error("Function not implemented.");
}

function showWeeklyResults() {
  throw new Error("Function not implemented.");
}
