export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
       categories: {
         Row: {
           id: string
           name: string
           slug: string
           description: string | null
           is_active: boolean
           display_order?: number | null
           display_mode?: string | null
           created_at: string
           updated_at: string
         }
         Insert: {
           id?: string
           name: string
           slug: string
           description?: string | null
           is_active?: boolean
           display_order?: number | null
           display_mode?: string | null
           created_at?: string
           updated_at?: string
         }
         Update: {
           id?: string
           name?: string
           slug?: string
           description?: string | null
           is_active?: boolean
           display_order?: number | null
           display_mode?: string | null
           created_at?: string
           updated_at?: string
         }
         Relationships: []
       }
      products: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          short_description: string | null
          price: string
          compare_at_price: string | null
          stock_quantity: number
          is_available: boolean
          category_id: string | null
          is_featured: boolean
          is_published: boolean
          specifications: Json
          card_layout?: string | null
          homepage_section?: string | null
          homepage_order?: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          short_description?: string | null
          price: string
          compare_at_price?: string | null
          stock_quantity?: number
          is_available?: boolean
          category_id?: string | null
          is_featured?: boolean
          is_published?: boolean
          specifications?: Json
          card_layout?: string | null
          homepage_section?: string | null
          homepage_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          short_description?: string | null
          price?: string
          compare_at_price?: string | null
          stock_quantity?: number
          is_available?: boolean
          category_id?: string | null
          is_featured?: boolean
          is_published?: boolean
          specifications?: Json
          card_layout?: string | null
          homepage_section?: string | null
          homepage_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'products_category_id_fkey'
            columns: ['category_id']
            isOneToOne: false
            referencedRelation: 'categories'
            referencedColumns: ['id']
          }
        ]
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          image_url: string
          alt_text: string | null
          position: number
          is_primary: boolean
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          image_url: string
          alt_text?: string | null
          position?: number
          is_primary?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          image_url?: string
          alt_text?: string | null
          position?: number
          is_primary?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'product_images_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
       profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          phone: string | null
          address: string | null
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          phone?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          email?: string
          phone?: string | null
          address?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          id: string
          created_at: string
        }
        Insert: {
          id: string
          created_at?: string
        }
        Update: {
          id?: string
          created_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          phone: string | null
          subject: string | null
          message: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone?: string | null
          subject?: string | null
          message: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string | null
          subject?: string | null
          message?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      delivery_locations: {
        Row: {
          id: string
          name: string
          region: string
          city: string
          delivery_fee: number
          estimated_delivery: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          region: string
          city: string
          delivery_fee?: number
          estimated_delivery?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          region?: string
          city?: string
          delivery_fee?: number
          estimated_delivery?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          profile_id: string | null
          status: string
          payment_state: string
          total: string
          currency: string
          shipping_address: string | null
          city: string | null
          phone: string | null
          notes: string | null
          guest_access_token: string | null
          delivery_location_id: string | null
          delivery_location_name: string | null
          delivery_region: string | null
          delivery_city: string | null
          delivery_fee: number
          delivery_estimated: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          status?: string
          payment_state?: string
          total: string
          currency?: string
          shipping_address?: string | null
          city?: string | null
          phone?: string | null
          notes?: string | null
          guest_access_token?: string | null
          delivery_location_id?: string | null
          delivery_location_name?: string | null
          delivery_region?: string | null
          delivery_city?: string | null
          delivery_fee?: number
          delivery_estimated?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          status?: string
          payment_state?: string
          total?: string
          currency?: string
          shipping_address?: string | null
          city?: string | null
          phone?: string | null
          notes?: string | null
          guest_access_token?: string | null
          delivery_location_id?: string | null
          delivery_location_name?: string | null
          delivery_region?: string | null
          delivery_city?: string | null
          delivery_fee?: number
          delivery_estimated?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_delivery_location_id_fkey'
            columns: ['delivery_location_id']
            isOneToOne: false
            referencedRelation: 'delivery_locations'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_price: string
          quantity: number
          total_price: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          product_price: string
          quantity: number
          total_price: string
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          product_price?: string
          quantity?: number
          total_price?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          }
        ]
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          subscribed_at: string
          is_active: boolean
          unsubscribe_token: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string
          is_active?: boolean
          unsubscribe_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string
          is_active?: boolean
          unsubscribe_token?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          id: string
          profile_id: string | null
          order_id: string | null
          product_id: string | null
          service_type: string
          status: string
          scheduled_at: string | null
          address: string | null
          notes: string | null
          price: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id?: string | null
          order_id?: string | null
          product_id?: string | null
          service_type: string
          status?: string
          scheduled_at?: string | null
          address?: string | null
          notes?: string | null
          price?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string | null
          order_id?: string | null
          product_id?: string | null
          service_type?: string
          status?: string
          scheduled_at?: string | null
          address?: string | null
          notes?: string | null
          price?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'service_requests_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'service_requests_product_id_fkey'
            columns: ['product_id']
            isOneToOne: false
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'service_requests_profile_id_fkey'
            columns: ['profile_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      hero_configs: {
        Row: {
          id: string
          is_active: boolean
          image_url: string
          image_alt: string | null
          heading: string
          subheading: string | null
          primary_cta_text: string
          primary_cta_url: string
          secondary_cta_text: string | null
          secondary_cta_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          image_url: string
          image_alt?: string | null
          heading: string
          subheading?: string | null
          primary_cta_text: string
          primary_cta_url: string
          secondary_cta_text?: string | null
          secondary_cta_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_active?: boolean
          image_url?: string
          image_alt?: string | null
          heading?: string
          subheading?: string | null
          primary_cta_text?: string
          primary_cta_url?: string
          secondary_cta_text?: string | null
          secondary_cta_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      inventory_movements: {
        Row: {
          id: string
          product_id: string
          movement_type: string
          quantity_change: number
          quantity_before: number
          quantity_after: number
          reason: string | null
          reference_type: string | null
          reference_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          movement_type: string
          quantity_change: number
          quantity_before: number
          quantity_after: number
          reason?: string | null
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          movement_type?: string
          quantity_change?: number
          quantity_before?: number
          quantity_after?: number
          reason?: string | null
          reference_type?: string | null
          reference_id?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "auth_users"
            referencedColumns: ["id"]
          }
        ]
      }
      site_branding: {
        Row: {
          id: string
          icon_path: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          icon_path?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          icon_path?: string | null
          updated_at?: string
        }
        Relationships: []
       }
       homepage_layout: {
         Row: {
           id: string
           layout_config: Json
           created_at: string
           updated_at: string
         }
         Insert: {
           id?: string
           layout_config?: Json
           created_at?: string
           updated_at?: string
         }
         Update: {
           id?: string
           layout_config?: Json
           created_at?: string
           updated_at?: string
         }
         Relationships: []
       }
     }
     Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      handle_updated_at: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      handle_new_user: {
        Args: Record<PropertyKey, never>
        Returns: unknown
      }
      perform_stock_operation: {
        Args: {
          p_product_id: string
          p_movement_type: string
          p_quantity_change: number
          p_reason?: string | null
          p_reference_type?: string | null
          p_reference_id?: string | null
          p_notes?: string | null
          p_created_by?: string | null
        }
        Returns: {
          success: boolean
          error: string | null
          new_stock: number | null
          movement_id: string | null
        }[]
      }
    }
    Enums: {
      [_ in string]: never
    }
    CompositeTypes: {
      [_ in string]: never
    }
  }
}

export type Tables<
  TableName extends keyof Database['public']['Tables'],
  SchemaName extends keyof Database = 'public'
> = Database[SchemaName]['Tables'][TableName] extends { Row: infer R }
  ? R
  : never

export type TablesInsert<
  TableName extends keyof Database['public']['Tables'],
  SchemaName extends keyof Database = 'public'
> = Database[SchemaName]['Tables'][TableName] extends { Insert: infer I }
  ? I
  : never

export type TablesUpdate<
  TableName extends keyof Database['public']['Tables'],
  SchemaName extends keyof Database = 'public'
> = Database[SchemaName]['Tables'][TableName] extends { Update: infer U }
  ? U
  : never

export type Enums<
  EnumName extends keyof Database['public']['Enums'],
  SchemaName extends keyof Database = 'public'
> = Database[SchemaName]['Enums'][EnumName]

export type CompositeTypes<
  CompositeTypeName extends keyof Database['public']['CompositeTypes'],
  SchemaName extends keyof Database = 'public'
> = Database[SchemaName]['CompositeTypes'][CompositeTypeName]
