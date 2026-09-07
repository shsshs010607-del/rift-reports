/**
 * Supabase 스키마 타입.
 * 실제 프로젝트에서는 `supabase gen types typescript --project-id <id> > src/lib/types/database.ts`
 * 로 자동 생성한다. 아래는 supabase/schema.sql 과 동기화한 수동 정의.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Tier = "S" | "A" | "B" | "C";
export type CommunityCategory = "riftbound" | "report" | "deck-guide" | "tournament" | "recruit";
export type TradingCategory = "sell" | "buy" | "trade";
export type TradeStatus = "open" | "reserved" | "closed";
export type TournamentStatus = "upcoming" | "ongoing" | "finished";
export type ReportStatus = "draft" | "published";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          avatar_url: string | null;
          bio: string | null;
          role: "user" | "editor" | "admin";
          onboarded: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          avatar_url?: string | null;
          bio?: string | null;
          role?: "user" | "editor" | "admin";
          onboarded?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string;
          cover_image_url: string | null;
          tag: string | null;
          status: ReportStatus;
          author_id: string | null;
          published_at: string | null;
          view_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reports"]["Row"], "id" | "view_count" | "created_at" | "updated_at"> & {
          id?: string;
          view_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
        Relationships: [];
      };
      cards: {
        Row: {
          id: string;
          code: string;
          name: string;
          name_en: string | null;
          set_code: string;
          rarity: string;
          domains: string[];
          type: string;
          subtypes: string[];
          cost: number | null;
          might: number | null;
          text: string | null;
          flavor: string | null;
          image_url: string | null;
          artist: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["cards"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["cards"]["Insert"]>;
        Relationships: [];
      };
      decks: {
        Row: {
          id: string;
          slug: string;
          name: string;
          archetype: string | null;
          tier: Tier;
          tier_rank: number;
          summary: string | null;
          guide: string | null;
          champion_card_ids: string[];
          author_id: string | null;
          is_featured: boolean;
          updated_at: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["decks"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["decks"]["Insert"]>;
        Relationships: [];
      };
      deck_cards: {
        Row: { deck_id: string; card_id: string; quantity: number; board: "main" | "rune" | "sideboard" };
        Insert: Database["public"]["Tables"]["deck_cards"]["Row"];
        Update: Partial<Database["public"]["Tables"]["deck_cards"]["Row"]>;
        Relationships: [];
      };
      glossary_terms: {
        Row: {
          id: string;
          name_en: string;
          term: string;
          is_official: boolean;
          symbol: string | null;
          category: string | null;
          definition: string;
          related_terms: string[];
          card_searchable: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["glossary_terms"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["glossary_terms"]["Insert"]>;
        Relationships: [];
      };
      posts: {
        Row: {
          id: string;
          category: CommunityCategory;
          title: string;
          body: string;
          author_id: string;
          deck_id: string | null;
          view_count: number;
          like_count: number;
          comment_count: number;
          is_notice: boolean;
          is_pinned: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["posts"]["Row"],
          | "id"
          | "deck_id"
          | "view_count"
          | "like_count"
          | "comment_count"
          | "is_notice"
          | "is_pinned"
          | "created_at"
          | "updated_at"
        > & {
          id?: string;
          deck_id?: string | null;
          is_notice?: boolean;
          is_pinned?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["posts"]["Insert"]>;
        Relationships: [];
      };
      post_likes: {
        Row: { post_id: string; user_id: string; created_at: string };
        Insert: { post_id: string; user_id: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["post_likes"]["Row"]>;
        Relationships: [];
      };
      saved_decks: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          code: string;
          legend_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          code: string;
          legend_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["saved_decks"]["Insert"]>;
        Relationships: [];
      };
      shops: {
        Row: {
          id: string;
          name: string;
          sido: string;
          sigungu: string | null;
          address: string;
          lat: number | null;
          lng: number | null;
          phone: string | null;
          hours: string | null;
          url: string | null;
          is_official: boolean;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["shops"]["Row"],
          "id" | "is_official" | "created_at" | "updated_at"
        > & { id?: string; is_official?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["shops"]["Insert"]>;
        Relationships: [];
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          parent_id: string | null;
          body: string;
          author_id: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["comments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Insert"]>;
        Relationships: [];
      };
      trade_listings: {
        Row: {
          id: string;
          category: TradingCategory;
          title: string;
          description: string | null;
          card_id: string | null;
          card_condition: string | null;
          price: number | null;
          is_negotiable: boolean;
          status: TradeStatus;
          region: string | null;
          images: string[];
          seller_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["trade_listings"]["Row"],
          "id" | "status" | "created_at" | "updated_at"
        > & { id?: string; status?: TradeStatus; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["trade_listings"]["Insert"]>;
        Relationships: [];
      };
      tournaments: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          format: string | null;
          status: TournamentStatus;
          starts_at: string;
          ends_at: string | null;
          location: string | null;
          is_online: boolean;
          organizer: string | null;
          registration_url: string | null;
          prize_pool: string | null;
          banner_url: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["tournaments"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tournaments"]["Insert"]>;
        Relationships: [];
      };
      card_prints: {
        Row: {
          id: string;
          card_id: string | null;
          group_id: string;
          name: string;
          name_en: string | null;
          set_code: string | null;
          number: string | null;
          rarity: string | null;
          art_variant: string | null;
          language: string;
          finish: string;
          image_url: string | null;
          justtcg_card_id: string | null;
          tcgplayer_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["card_prints"]["Row"],
          "id" | "card_id" | "art_variant" | "language" | "finish" | "created_at" | "updated_at"
        > & {
          id?: string;
          card_id?: string | null;
          art_variant?: string | null;
          language?: string;
          finish?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["card_prints"]["Insert"]>;
        Relationships: [];
      };
      price_snapshots: {
        Row: {
          id: string;
          print_id: string;
          captured_at: string;
          is_current: boolean;
          is_headline: boolean;
          condition: string;
          printing: string;
          market_price: number | null;
          change_24h: number | null;
          change_7d: number | null;
          change_30d: number | null;
          change_90d: number | null;
          avg_price_30d: number | null;
          min_price_90d: number | null;
          max_price_90d: number | null;
          history: { t: number; p: number }[];
          currency: string;
          tcgplayer_sku: string | null;
        };
        Insert: Omit<
          Database["public"]["Tables"]["price_snapshots"]["Row"],
          "id" | "captured_at" | "is_headline" | "history"
        > & {
          id?: string;
          captured_at?: string;
          is_headline?: boolean;
          history?: { t: number; p: number }[];
        };
        Update: Partial<Database["public"]["Tables"]["price_snapshots"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      increment_view_count: {
        Args: { table_name: string; row_id: string };
        Returns: undefined;
      };
      username_available: {
        Args: { name: string };
        Returns: boolean;
      };
    };
    Enums: {
      tier: Tier;
      community_category: CommunityCategory;
      trading_category: TradingCategory;
      trade_status: TradeStatus;
      tournament_status: TournamentStatus;
      report_status: ReportStatus;
      user_role: "user" | "editor" | "admin";
      deck_board: "main" | "rune" | "sideboard";
    };
    CompositeTypes: { [_ in never]: never };
  };
}

// 편의 별칭
export type Report = Database["public"]["Tables"]["reports"]["Row"];
export type Card = Database["public"]["Tables"]["cards"]["Row"];
export type Deck = Database["public"]["Tables"]["decks"]["Row"];
export type GlossaryTerm = Database["public"]["Tables"]["glossary_terms"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type Comment = Database["public"]["Tables"]["comments"]["Row"];
export type TradeListing = Database["public"]["Tables"]["trade_listings"]["Row"];
export type Tournament = Database["public"]["Tables"]["tournaments"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type CardPrint = Database["public"]["Tables"]["card_prints"]["Row"];
export type PriceSnapshot = Database["public"]["Tables"]["price_snapshots"]["Row"];
export type SavedDeck = Database["public"]["Tables"]["saved_decks"]["Row"];
export type Shop = Database["public"]["Tables"]["shops"]["Row"];
