export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "author" | "reviewer" | "editor";
export type SubmissionStatus =
  | "submitted"
  | "under_review"
  | "revision_requested"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "published";
export type ReviewType = "single_blind" | "double_blind";
export type DecisionType = "accept" | "reject" | "revise";
export type CmsPageType = "static" | "policy" | "guide";
export type NotificationType =
  | "submission_received"
  | "reviewer_assigned"
  | "review_submitted"
  | "decision_made"
  | "paper_published"
  | "submission_withdrawn"
  | "review_reminder"
  | "revision_requested";

export interface CoAuthor {
  name: string;
  affiliation: string;
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          affiliation: string;
          orcid_id: string | null;
          roles: UserRole[];
          bio: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          affiliation?: string;
          orcid_id?: string | null;
          roles?: UserRole[];
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          affiliation?: string;
          orcid_id?: string | null;
          roles?: UserRole[];
          bio?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      submissions: {
        Row: {
          id: string;
          title: string;
          abstract: string;
          keywords: string[];
          co_authors: CoAuthor[];
          submitting_author_id: string;
          file_path: string | null;
          status: SubmissionStatus;
          extracted_text: string | null;
          search_vector: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          abstract?: string;
          keywords?: string[];
          co_authors?: CoAuthor[];
          submitting_author_id: string;
          file_path?: string | null;
          status?: SubmissionStatus;
          extracted_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          abstract?: string;
          keywords?: string[];
          co_authors?: CoAuthor[];
          submitting_author_id?: string;
          file_path?: string | null;
          status?: SubmissionStatus;
          extracted_text?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "submissions_submitting_author_id_fkey";
            columns: ["submitting_author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          submission_id: string;
          reviewer_id: string;
          content: string | null;
          deadline: string | null;
          submitted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          reviewer_id: string;
          content?: string | null;
          deadline?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          reviewer_id?: string;
          content?: string | null;
          deadline?: string | null;
          submitted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey";
            columns: ["reviewer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      decisions: {
        Row: {
          id: string;
          submission_id: string;
          editor_id: string;
          decision: DecisionType;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          editor_id: string;
          decision: DecisionType;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          editor_id?: string;
          decision?: DecisionType;
          notes?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "decisions_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: false;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "decisions_editor_id_fkey";
            columns: ["editor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      publications: {
        Row: {
          id: string;
          submission_id: string;
          doi: string | null;
          published_at: string;
          retracted: boolean;
          retraction_notice: string | null;
          volume: number | null;
          issue: number | null;
          crossref_deposit_status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          doi?: string | null;
          published_at?: string;
          retracted?: boolean;
          retraction_notice?: string | null;
          volume?: number | null;
          issue?: number | null;
          crossref_deposit_status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          submission_id?: string;
          doi?: string | null;
          published_at?: string;
          retracted?: boolean;
          retraction_notice?: string | null;
          volume?: number | null;
          issue?: number | null;
          crossref_deposit_status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "publications_submission_id_fkey";
            columns: ["submission_id"];
            isOneToOne: true;
            referencedRelation: "submissions";
            referencedColumns: ["id"];
          },
        ];
      };
      cms_pages: {
        Row: {
          id: string;
          slug: string;
          title: string;
          page_type: CmsPageType;
          content_json: Json;
          content_html: string;
          published: boolean;
          author_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          page_type?: CmsPageType;
          content_json?: Json;
          content_html?: string;
          published?: boolean;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          page_type?: CmsPageType;
          content_json?: Json;
          content_html?: string;
          published?: boolean;
          author_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cms_pages_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message?: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: NotificationType;
          title?: string;
          message?: string;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      journal_settings: {
        Row: {
          id: string;
          journal_name: string;
          journal_logo_url: string | null;
          primary_color: string;
          review_type: ReviewType;
          default_review_deadline_days: number;
          doi_prefix: string;
          crossref_username: string | null;
          crossref_password: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          journal_name?: string;
          journal_logo_url?: string | null;
          primary_color?: string;
          review_type?: ReviewType;
          default_review_deadline_days?: number;
          doi_prefix?: string;
          crossref_username?: string | null;
          crossref_password?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          journal_name?: string;
          journal_logo_url?: string | null;
          primary_color?: string;
          review_type?: ReviewType;
          default_review_deadline_days?: number;
          doi_prefix?: string;
          crossref_username?: string | null;
          crossref_password?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: { user_id: string; required_role: UserRole };
        Returns: boolean;
      };
      is_double_blind: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      search_publications: {
        Args: {
          search_query: string;
          result_limit?: number;
          result_offset?: number;
        };
        Returns: {
          id: string;
          title: string;
          abstract: string;
          keywords: string[];
          author_name: string;
          author_affiliation: string;
          headline: string;
          rank: number;
        }[];
      };
    };
    Enums: {
      user_role: UserRole;
      submission_status: SubmissionStatus;
      review_type: ReviewType;
      decision_type: DecisionType;
      cms_page_type: CmsPageType;
      notification_type: NotificationType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
