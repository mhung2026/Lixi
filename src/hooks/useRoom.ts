'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Prize {
  id: string;
  type: 'cash' | 'item';
  name: string;
  value: number;
  quantity: number;
  remaining: number;
}

interface Player {
  id: string;
  name: string;
  phone: string | null;
  shakes_used: number;
  created_at: string;
}

interface Result {
  id: string;
  player_id: string;
  prize_id: string;
  created_at: string;
  players?: { name: string; phone: string | null };
  prizes?: { name: string; type: string; value: number };
}

interface Room {
  id: string;
  code: string;
  host_name: string;
  mode: 'online' | 'local';
  max_shakes: number;
  status: 'waiting' | 'active' | 'ended';
  host_phone: string | null;
  game_modes: string[];
  created_at: string;
}

export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial fetch
  useEffect(() => {
    async function fetchRoom() {
      setLoading(true);

      const { data: roomData } = await supabase
        .from('rooms')
        .select('*')
        .eq('code', code)
        .single();

      if (!roomData) {
        setLoading(false);
        return;
      }

      setRoom(roomData);

      const [prizesRes, playersRes, resultsRes] = await Promise.all([
        supabase.from('prizes').select('*').eq('room_id', roomData.id),
        supabase.from('players').select('*').eq('room_id', roomData.id).order('created_at', { ascending: true }),
        supabase
          .from('results')
          .select('*, players(name, phone), prizes(name, type, value)')
          .eq('room_id', roomData.id)
          .order('created_at', { ascending: false }),
      ]);

      setPrizes(prizesRes.data || []);
      setPlayers(playersRes.data || []);
      setResults(resultsRes.data || []);
      setLoading(false);
    }

    if (code) fetchRoom();
  }, [code]);

  // Realtime subscriptions
  useEffect(() => {
    if (!room?.id) return;

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `room_id=eq.${room.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setPlayers((prev) => [...prev, payload.new as Player]);
          } else if (payload.eventType === 'UPDATE') {
            setPlayers((prev) =>
              prev.map((p) => (p.id === (payload.new as Player).id ? (payload.new as Player) : p))
            );
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'prizes', filter: `room_id=eq.${room.id}` },
        (payload) => {
          setPrizes((prev) =>
            prev.map((p) => (p.id === (payload.new as Prize).id ? (payload.new as Prize) : p))
          );
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'results', filter: `room_id=eq.${room.id}` },
        async (payload) => {
          const newResult = payload.new as Result;
          // Fetch related data
          const [playerRes, prizeRes] = await Promise.all([
            supabase.from('players').select('name, phone').eq('id', newResult.player_id).single(),
            supabase.from('prizes').select('name, type, value').eq('id', newResult.prize_id).single(),
          ]);
          const enriched = {
            ...newResult,
            players: playerRes.data || undefined,
            prizes: prizeRes.data || undefined,
          };
          setResults((prev) => [enriched, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room?.id]);

  return { room, prizes, players, results, loading };
}
